import { appointmentTable } from '$lib/server/db/schema';
import { and, eq, gt, gte, lt, lte, or } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

async function checkAppointmentOverlap(
	db: DrizzleD1Database<Record<string, never>> & {
		$client: unknown;
	},
	employeeId: number,
	date: string,
	startTime: string,
	endTime: string
): Promise<boolean> {
	// Find any appointments that overlap with the requested time slot
	// The query is optimized to use the appointment_employee_date_time_idx index
	const overlappingAppointments = await db
		.select({
			id: appointmentTable.id,
			time_from: appointmentTable.time_from,
			time_to: appointmentTable.time_to
		})
		.from(appointmentTable)
		.where(
			and(
				eq(appointmentTable.employeeId, employeeId), // First in index
				eq(appointmentTable.date, date),             // Second in index
				or(
					// Case 1: New appointment starts during an existing appointment
					and(lte(appointmentTable.time_from, startTime), gt(appointmentTable.time_to, startTime)),
					// Case 2: New appointment ends during an existing appointment
					and(lt(appointmentTable.time_from, endTime), gte(appointmentTable.time_to, endTime)),
					// Case 3: New appointment completely contains an existing appointment
					and(gte(appointmentTable.time_from, startTime), lte(appointmentTable.time_to, endTime)),
					// Case 4: An existing appointment completely contains the new appointment
					and(lte(appointmentTable.time_from, startTime), gte(appointmentTable.time_to, endTime))
				)
			)
		);

	return overlappingAppointments.length > 0;
}

export default checkAppointmentOverlap;
