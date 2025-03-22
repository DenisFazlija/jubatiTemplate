import { z } from 'zod';

export const AppointmentSchemaAdmin = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email().nullable(),
	phone: z.string().min(1).nullable(),
	street: z.string().min(1).nullable(),
	zip: z.string().min(1).nullable(),
	city: z.string().min(1).nullable(),
	employeeId: z.number(),
	date: z.string().min(1),
	time: z.string().min(1),
	service: z.number(),
	description: z.string().min(1).nullable()
});

export type AppointmentSchemaAdmin = z.infer<typeof AppointmentSchemaAdmin>;

export const EditAppointmentSchemaAdmin = z.object({
	appointmentId: z.number(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email().nullable(),
	phone: z.string().min(1).nullable(),
	street: z.string().min(1).nullable(),
	zip: z.string().min(1).nullable(),
	city: z.string().min(1).nullable(),
	employeeId: z.number(),
	date: z.string().min(1),
	time: z.string().min(1),
	service: z.number(),
	description: z.string().min(1).nullable()
});

export type EditAppointmentSchemaAdmin = z.infer<typeof EditAppointmentSchemaAdmin>;
