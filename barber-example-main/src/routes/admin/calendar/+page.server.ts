import {
	appointmentTable,
	customerTable,
	employeeTable,
	serviceTable
} from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import dayjs from '$lib/dayjs';
import isAuthenticated from '../isAuthenticated';
import {
	AppointmentSchemaAdmin,
	EditAppointmentSchemaAdmin
} from '$lib/schemas/AppointmentSchemaAdmin';
import { drizzle } from 'drizzle-orm/d1';
import {
	getAppointmentConfirmationHtml,
	getAppointmentConfirmationText
} from '$lib/server/email-templates';
import { sendMail } from '$lib/server/mail';
import * as m from '$lib/paraglide/messages';

export const load = (async ({ url, locals, platform }) => {
	const db = drizzle(platform!.env.DB);

	isAuthenticated(locals.session);

	const date = url.searchParams.get('date') ?? dayjs().format('YYYY-MM-DD');

	// Create optimized queries - we'll execute them in a batch
	const appointmentsQuery = db
		.select({
			id: appointmentTable.id,
			serviceId: appointmentTable.serviceId,
			serviceName: serviceTable.service,
			employeeId: appointmentTable.employeeId,
			employeeName: employeeTable.name,
			date: appointmentTable.date,
			time_from: appointmentTable.time_from,
			time_to: appointmentTable.time_to,
			customerId: appointmentTable.customerId,
			firstName: customerTable.firstName,
			lastName: customerTable.lastName,
			description: appointmentTable.description
		})
		.from(appointmentTable)
		// Use index order for efficient joins - primary key or indexed columns first
		.leftJoin(customerTable, eq(appointmentTable.customerId, customerTable.id)) // Uses appointment_customer_id_idx
		.leftJoin(serviceTable, eq(appointmentTable.serviceId, serviceTable.id)) // Uses appointment_service_id_idx
		.leftJoin(employeeTable, eq(appointmentTable.employeeId, employeeTable.id)) // Completes the join chain
		.where(eq(appointmentTable.date, date)); // Uses appointment_date_idx

	const servicesQuery = db
		.select({
			id: serviceTable.id,
			service: serviceTable.service,
			duration: serviceTable.duration
		})
		.from(serviceTable);

	const employeesQuery = db
		.select({
			id: employeeTable.id,
			name: employeeTable.name
		})
		.from(employeeTable);

	// Execute all queries in a single batch for D1 (single network roundtrip)
	const [appointments, services, employees] = await db.batch([
		appointmentsQuery,
		servicesQuery,
		employeesQuery
	]);

	const form = await superValidate(zod(AppointmentSchemaAdmin));
	const editForm = await superValidate(zod(EditAppointmentSchemaAdmin));

	return {
		form,
		editForm,
		employees,
		services,
		appointments
	};
}) satisfies PageServerLoad;

export const actions = {
	add: async ({ request, locals, platform }) => {
		const db = drizzle(platform!.env.DB);
		isAuthenticated(locals.session);
		const form = await superValidate(request, zod(AppointmentSchemaAdmin));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// remove turnstile response from form data
			delete (
				form.data as Omit<typeof form.data, 'cf-turnstile-response'> & {
					'cf-turnstile-response'?: string;
				}
			)['cf-turnstile-response'];

			// Step 1: Create customer
			let customer;
			try {
				[customer] = await db
					.insert(customerTable)
					.values(form.data)
					.returning({ id: customerTable.id });
			} catch (error) {
				console.error('Error creating customer:', error);
				throw new Error('Failed to create customer');
			}

			// Step 2: Get service duration
			let selectedServices, employeeName;
			try {
				const [serviceResults, employeeResults] = await db.batch([
					db
						.select({ duration: serviceTable.duration, service: serviceTable.service })
						.from(serviceTable)
						.where(eq(serviceTable.id, +form.data.service)),
					db
						.select({ name: employeeTable.name })
						.from(employeeTable)
						.where(eq(employeeTable.id, +form.data.employeeId))
				]);

				selectedServices = serviceResults;
				employeeName = employeeResults;

				if (!selectedServices) {
					throw new Error('Service not found');
				}
			} catch (error) {
				// If service selection fails, clean up the customer
				await db.delete(customerTable).where(eq(customerTable.id, customer.id));
				console.error('Error getting service duration or employee name:', error);
				throw new Error('Failed to get service information');
			}
			// Calculate appointment times
			const totalMinutes = selectedServices.reduce((sum, service) => sum + service.duration, 0);
			const startTime = dayjs(`${form.data.date} ${form.data.time}`, 'YYYY-MM-DD HH:mm');
			const endTime = startTime.add(totalMinutes, 'minutes');
			const formattedEndTime = endTime.format('HH:mm');

			// Step 3: Create appointment
			let appointments;
			try {
				appointments = await db
					.insert(appointmentTable)
					.values({
						serviceId: +form.data.service,
						employeeId: +form.data.employeeId,
						date: form.data.date,
						time_from: form.data.time,
						time_to: formattedEndTime,
						customerId: customer.id,
						description: form.data.description
					})
					.returning({
						id: appointmentTable.id,
						serviceId: appointmentTable.serviceId,
						time_from: appointmentTable.time_from,
						time_to: appointmentTable.time_to
					});
			} catch (error) {
				// If appointment creation fails, clean up the customer
				await db.delete(customerTable).where(eq(customerTable.id, customer.id));
				console.error('Error creating appointment:', error);
				throw new Error('Failed to create appointment');
			}

			// Format date for email
			const formattedDate = dayjs(form.data.date).format('dddd, MMMM D, YYYY');

			// Generate email content using the template functions
			const htmlEmail = getAppointmentConfirmationHtml(
				form.data.firstName,
				form.data.lastName,
				selectedServices[0].service,
				formattedDate,
				form.data.time,
				employeeName[0].name
			);

			const plainText = getAppointmentConfirmationText(
				form.data.firstName,
				form.data.lastName,
				selectedServices[0].service,
				formattedDate,
				form.data.time,
				employeeName[0].name
			);

			if (form.data.email) {
				await sendMail(
					{ name: 'barber', addr: 'barber@jubati.ch' },
					{ name: `${form.data.firstName} ${form.data.lastName}`, addr: form.data.email },
					m.email_confirmation_subject(),
					plainText,
					htmlEmail
				);
			}

			const result = {
				success: true,
				customerId: customer.id,
				appointments
			};

			return { form, result };
		} catch (error) {
			console.error('Error during appointment creation:', error);
			return fail(500, {
				success: false,
				errors: {
					general:
						error instanceof Error
							? error.message
							: 'Failed to create appointment. Please try again.'
				}
			});
		}
	},
	edit: async ({ request, locals, platform }) => {
		const db = drizzle(platform!.env.DB);
		isAuthenticated(locals.session);
		const form = await superValidate(request, zod(EditAppointmentSchemaAdmin));

		const appointmentId = form.data.appointmentId;

		if (!appointmentId) {
			return fail(400, { error: 'Appointment ID is required' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// First, get the current appointment to find the customer ID
			const currentAppointment = await db
				.select({ customerId: appointmentTable.customerId })
				.from(appointmentTable)
				.where(eq(appointmentTable.id, +appointmentId))
				.limit(1);

			if (!currentAppointment.length) {
				return fail(404, { error: 'Appointment not found' });
			}

			const customerId = currentAppointment[0].customerId;

			// Step 1: Update customer information
			try {
				await db
					.update(customerTable)
					.set({
						firstName: form.data.firstName,
						lastName: form.data.lastName,
						email: form.data.email,
						phone: form.data.phone,
						street: form.data.street,
						zip: form.data.zip,
						city: form.data.city
					})
					.where(eq(customerTable.id, customerId));
			} catch (error) {
				console.error('Error updating customer:', error);
				throw new Error('Failed to update customer information');
			}

			// Step 2: Get service duration
			let selectedService;
			try {
				selectedService = await db
					.select({ duration: serviceTable.duration })
					.from(serviceTable)
					.where(eq(serviceTable.id, +form.data.service))
					.limit(1);

				if (!selectedService.length) {
					throw new Error('Service not found');
				}
			} catch (error) {
				console.error('Error getting service duration:', error);
				throw new Error('Failed to get service information');
			}

			// Calculate appointment times
			const totalMinutes = selectedService[0].duration;
			const startTime = dayjs(`${form.data.date} ${form.data.time}`, 'YYYY-MM-DD HH:mm');
			const endTime = startTime.add(totalMinutes, 'minutes');
			const formattedEndTime = endTime.format('HH:mm');

			// Step 3: Update appointment
			try {
				await db
					.update(appointmentTable)
					.set({
						serviceId: +form.data.service,
						employeeId: +form.data.employeeId,
						date: form.data.date,
						time_from: form.data.time,
						time_to: formattedEndTime,
						description: form.data.description
					})
					.where(eq(appointmentTable.id, +appointmentId));
			} catch (error) {
				console.error('Error updating appointment:', error);
				throw new Error('Failed to update appointment');
			}

			return {
				form,
				success: true
			};
		} catch (error) {
			console.error('Error during appointment update:', error);
			return fail(500, {
				form,
				success: false,
				errors: {
					general:
						error instanceof Error
							? error.message
							: 'Failed to update appointment. Please try again.'
				}
			});
		}
	},
	delete: async ({ request, locals, platform }) => {
		const db = drizzle(platform!.env.DB);

		isAuthenticated(locals.session);

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			return fail(400, { error: 'Appointment ID is required' });
		}

		try {
			await db.delete(appointmentTable).where(eq(appointmentTable.id, +id));
			return { success: true };
		} catch (error) {
			console.error('Error deleting appointment:', error);
			return fail(500, { error: 'Failed to delete appointment' });
		}
	}
} satisfies Actions;
