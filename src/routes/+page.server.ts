import {
	appointmentTable,
	customerTable,
	employeeTable,
	serviceTable
} from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { checkCaptcha } from './check-captcha';
import { TURNSTILE_SECRET } from '$env/static/private';
import dayjs from '$lib/dayjs';
import checkAppointmentOverlap from './checkAppointmentOverlap';
import { AppointmentSchema } from '$lib/schemas/AppointmentSchema';
import { drizzle } from 'drizzle-orm/d1';
import { sendMail } from '$lib/server/mail';
import * as m from '$lib/paraglide/messages';
import {
	getAppointmentConfirmationHtml,
	getAppointmentConfirmationText
} from '$lib/server/email-templates';

export const load = (async ({ platform, setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=300'
	});
	const db = drizzle(platform!.env.DB);
	const [employees, services] = await db.batch([
		db
			.select({
				id: employeeTable.id,
				name: employeeTable.name
			})
			.from(employeeTable),

		db
			.select({
				id: serviceTable.id,
				service: serviceTable.service,
				duration: serviceTable.duration
			})
			.from(serviceTable)
	]);

	const form = await superValidate(zod(AppointmentSchema));

	return { form, employees, services };
}) satisfies PageServerLoad;
export const actions = {
	add: async ({ request, getClientAddress, platform }) => {
		const db = drizzle(platform!.env.DB);
		const form = await superValidate(request, zod(AppointmentSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// Check if date is in the past
		if (dayjs(form.data.date).startOf('day').isBefore(dayjs().startOf('day'))) {
			return {
				form,
				success: false,
				error: 'This date is in the past. Please choose another date.'
			};
		}

		// Verify captcha
		const captchaSuccess = await checkCaptcha(
			TURNSTILE_SECRET,
			form.data['cf-turnstile-response'],
			getClientAddress(),
			crypto.randomUUID()
		);

		if (!captchaSuccess) {
			return fail(403, { form });
		}

		try {
			// Remove captcha response from form data
			delete (
				form.data as Omit<typeof form.data, 'cf-turnstile-response'> & {
					'cf-turnstile-response'?: string;
				}
			)['cf-turnstile-response'];

			// Step 1: Calculate appointment end time
			let selectedServices;
			try {
				selectedServices = await db
					.select({ duration: serviceTable.duration })
					.from(serviceTable)
					.where(eq(serviceTable.id, +form.data.service));

				if (!selectedServices.length) {
					return fail(400, {
						form,
						error: 'Selected service not found'
					});
				}
			} catch (error) {
				console.error('Error getting service duration:', error);
				throw new Error('Failed to get service information');
			}

			const totalMinutes = selectedServices.reduce((sum, service) => sum + service.duration, 0);
			const startTime = form.data.time;
			const endTime = dayjs(`${form.data.date} ${startTime}`)
				.add(totalMinutes, 'minutes')
				.format('HH:mm');

			// Step 2: Check for overlapping appointments
			const hasOverlap = await checkAppointmentOverlap(
				db,
				form.data.employeeId,
				form.data.date,
				startTime,
				endTime
			);

			if (hasOverlap) {
				return {
					form,
					success: false,
					error: 'This time slot is already booked. Please choose another time.'
				};
			}

			// Step 3: Create customer
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

			// Step 4: Create appointment
			try {
				await db
					.insert(appointmentTable)
					.values({
						serviceId: +form.data.service,
						employeeId: +form.data.employeeId,
						date: form.data.date,
						time_from: startTime,
						time_to: endTime,
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

			// Get service and employee details for the email
			const batchResult = await db.batch([
				db
					.select({ service: serviceTable.service })
					.from(serviceTable)
					.where(eq(serviceTable.id, +form.data.service)),
				db
					.select({ name: employeeTable.name })
					.from(employeeTable)
					.where(eq(employeeTable.id, +form.data.employeeId))
			]);

			// Extract results with fallback values
			const serviceDetails = batchResult[0][0]?.service || 'Service';
			const employeeDetails = batchResult[1][0]?.name || 'Employee';
			// Format date for email
			const formattedDate = dayjs(form.data.date).format('dddd, MMMM D, YYYY');

			// Generate email content using the template functions
			const htmlEmail = getAppointmentConfirmationHtml(
				form.data.firstName,
				form.data.lastName,
				serviceDetails,
				formattedDate,
				form.data.time,
				employeeDetails
			);

			const plainText = getAppointmentConfirmationText(
				form.data.firstName,
				form.data.lastName,
				serviceDetails,
				formattedDate,
				form.data.time,
				employeeDetails
			);

			// send mail
			await sendMail(
				{ name: 'barber', addr: 'barber@jubati.ch' },
				{ name: `${form.data.firstName} ${form.data.lastName}`, addr: form.data.email },
				m.email_confirmation_subject(),
				plainText,
				htmlEmail
			);

			return message(form, m.form_success());
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
	}
} satisfies Actions;
