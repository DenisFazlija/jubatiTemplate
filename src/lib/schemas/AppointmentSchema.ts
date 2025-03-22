import { z } from 'zod';

export const AppointmentSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email(),
	phone: z.string().min(1),
	street: z.string().min(1),
	zip: z.string().min(1),
	city: z.string().min(1),
	employeeId: z.number(),
	date: z.string().min(1),
	time: z.string().min(1),
	service: z.number(),
	description: z.string().min(1).nullable(),
	'cf-turnstile-response': z.string().min(1)
});

export type AppointmentSchema = z.infer<typeof AppointmentSchema>;
