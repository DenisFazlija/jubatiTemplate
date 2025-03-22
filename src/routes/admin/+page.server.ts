import {
	appointmentTable,
	employeeTable,
	serviceTable,
	shiftPlanTable
} from '$lib/server/db/schema';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { eq, inArray, not } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { fail } from '@sveltejs/kit';
import isAuthenticated from './isAuthenticated';
import { drizzle } from 'drizzle-orm/d1';
import { z } from 'zod';

const serviceSchema = z.object({
	services: z.array(
		z.object({
			id: z.number().optional(),
			service: z.string().min(1),
			duration: z.number()
		})
	)
});

const employeeSchema = z.object({
	employees: z.array(
		z.object({
			id: z.number().optional(),
			name: z.string().min(1),
			shifts: z.object({
				Mon_from: z.string().min(1),
				Mon_to: z.string().min(1),
				Tue_from: z.string().min(1),
				Tue_to: z.string().min(1),
				Wed_from: z.string().min(1),
				Wed_to: z.string().min(1),
				Thu_from: z.string().min(1),
				Thu_to: z.string().min(1),
				Fri_from: z.string().min(1),
				Fri_to: z.string().min(1),
				Sat_from: z.string().min(1),
				Sat_to: z.string().min(1),
				Sun_from: z.string().min(1),
				Sun_to: z.string().min(1),
				Lunch_from: z.string().min(1),
				Lunch_to: z.string().min(1)
			})
		})
	)
});

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = drizzle(platform!.env.DB);

	isAuthenticated(locals.session);

	const [employees, services] = await db.batch([
		// Query 1: Select employee data with shifts - optimize join order
		db
			.select({
				id: employeeTable.id,
				name: employeeTable.name,
				shifts: {
					Mon_from: shiftPlanTable.Mon_from,
					Mon_to: shiftPlanTable.Mon_to,
					Tue_from: shiftPlanTable.Tue_from,
					Tue_to: shiftPlanTable.Tue_to,
					Wed_from: shiftPlanTable.Wed_from,
					Wed_to: shiftPlanTable.Wed_to,
					Thu_from: shiftPlanTable.Thu_from,
					Thu_to: shiftPlanTable.Thu_to,
					Fri_from: shiftPlanTable.Fri_from,
					Fri_to: shiftPlanTable.Fri_to,
					Sat_from: shiftPlanTable.Sat_from,
					Sat_to: shiftPlanTable.Sat_to,
					Sun_from: shiftPlanTable.Sun_from,
					Sun_to: shiftPlanTable.Sun_to,
					Lunch_from: shiftPlanTable.Lunch_from,
					Lunch_to: shiftPlanTable.Lunch_to
				}
			})
			.from(employeeTable) // Small table, use as base
			.leftJoin(shiftPlanTable, eq(employeeTable.id, shiftPlanTable.employeeId)), // Uses shift_plan_employee_id_idx

		// Query 2: Select service data - select only needed fields for efficiency 
		db
			.select({
				id: serviceTable.id,
				service: serviceTable.service,
				duration: serviceTable.duration
			})
			.from(serviceTable) // Small table, can scan efficiently
	]);

	const servicesForm = await superValidate({ services }, zod(serviceSchema));
	const employeesForm = await superValidate({ employees }, zod(employeeSchema));

	return { servicesForm, employeesForm, employees, services };
};

export const actions = {
	editServices: async ({ request, locals, platform }) => {
		const db = drizzle(platform!.env.DB);

		isAuthenticated(locals.session);
		const form = await superValidate(request, zod(serviceSchema));

		if (!form.valid) {
			return fail(400, { form });
		}
		// Get IDs of services that should be kept
		const newServiceIds = form.data.services.filter((s) => s.id).map((s) => s.id);

		// Delete services that aren't in the new list
		await db
			.delete(serviceTable)
			.where(!newServiceIds.length ? undefined : not(inArray(serviceTable.id, newServiceIds)));

		// Prepare batch arrays for updates and inserts
		const servicesToUpdate = form.data.services.filter((s) => s.id);
		const servicesToInsert = form.data.services.filter((s) => !s.id);

		// Batch update existing services
		if (servicesToUpdate.length > 0) {
			await db.batch(
				servicesToUpdate.map((service) =>
					db
						.update(serviceTable)
						.set({
							service: service.service,
							duration: service.duration
						})
						.where(eq(serviceTable.id, service.id))
				)
			);
		}

		// Batch insert new services
		if (servicesToInsert.length > 0) {
			await db.insert(serviceTable).values(
				servicesToInsert.map((service) => ({
					service: service.service,
					duration: service.duration
				}))
			);
		}
		return message(form, 'Services updated successfully');
	},
	editEmployees: async ({ request, locals, platform }) => {
		const db = drizzle(platform!.env.DB);

		isAuthenticated(locals.session);
		const form = await superValidate(request, zod(employeeSchema));

		if (!form.valid) {
			return fail(400, { form });
		}
		// Get IDs of employees that should be kept
		const newEmployeeIds = form.data.employees.filter((e) => e.id).map((e) => e.id);

		if (newEmployeeIds.length) {
			// Delete in order of dependencies using optimized queries with proper indexes
			// Delete appointments for employees not in the new list - uses appointment_employee_date_idx
			await db
				.delete(appointmentTable)
				.where(not(inArray(appointmentTable.employeeId, newEmployeeIds)));

			// Delete shift plans for employees not in the new list - uses shift_plan_employee_id_idx
			await db
				.delete(shiftPlanTable)
				.where(not(inArray(shiftPlanTable.employeeId, newEmployeeIds)));

			// Delete employees not in the new list - uses primary key
			await db.delete(employeeTable).where(not(inArray(employeeTable.id, newEmployeeIds)));
		} else {
			// If no employees should be kept, delete all records in the correct order
			// This ensures proper cascade of dependencies
			await db.delete(appointmentTable); // First delete appointments (depend on employees)
			await db.delete(shiftPlanTable);   // Then delete shift plans (depend on employees)
			await db.delete(employeeTable);    // Finally delete employees
		}

		// Update or insert employees and their shifts
		for (const employee of form.data.employees) {
			if (employee.id) {
				// Update existing employee
				await db
					.update(employeeTable)
					.set({ name: employee.name })
					.where(eq(employeeTable.id, employee.id));

				await db
					.update(shiftPlanTable)
					.set(employee.shifts)
					.where(eq(shiftPlanTable.employeeId, employee.id));
			} else {
				// Insert new employee
				const [newEmployee] = await db
					.insert(employeeTable)
					.values({ name: employee.name })
					.returning({ id: employeeTable.id });

				await db.insert(shiftPlanTable).values({
					employeeId: newEmployee.id,
					...employee.shifts
				});
			}
		}
		return message(form, 'Employee shifts updated successfully');
	}
} satisfies Actions;
