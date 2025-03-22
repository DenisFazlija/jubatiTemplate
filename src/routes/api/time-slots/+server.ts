import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	appointmentTable,
	shiftPlanTable,
	employeeTable,
	serviceTable
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import dayjs from '$lib/dayjs';
import { drizzle } from 'drizzle-orm/d1';

type Appointment = {
	id: number;
	serviceId: number;
	employeeId: number;
	date: string;
	time_from: string;
	time_to: string;
	customerId: number;
};

interface TimeRange {
	shiftStart: string;
	shiftEnd: string;
	breakStart: string;
	breakEnd: string;
	appointments: Appointment[];
	serviceDuration: number;
}

export type TimeSlot = {
	time: string;
	available: boolean;
	employeeIds: number[];
};

// Define type for day keys
type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

const dayMap: Record<number, DayKey> = {
	0: 'Sun',
	1: 'Mon',
	2: 'Tue',
	3: 'Wed',
	4: 'Thu',
	5: 'Fri',
	6: 'Sat'
};

// Define shift type with dynamic day properties
interface ShiftWithEmployee {
	id: number;
	employeeId: number;
	Mon_from: string | null;
	Mon_to: string | null;
	Tue_from: string | null;
	Tue_to: string | null;
	Wed_from: string | null;
	Wed_to: string | null;
	Thu_from: string | null;
	Thu_to: string | null;
	Fri_from: string | null;
	Fri_to: string | null;
	Sat_from: string | null;
	Sat_to: string | null;
	Sun_from: string | null;
	Sun_to: string | null;
	Lunch_from: string | null;
	Lunch_to: string | null;
	employee: {
		id: number;
		name: string;
	};
}

export const GET: RequestHandler = async ({ url, platform }) => {
	const db = drizzle(platform!.env.DB);
	const date = url.searchParams.get('date');
	const serviceId = url.searchParams.get('serviceId');

	if (!date || !serviceId) {
		return json({ error: 'Date and serviceId are required' }, { status: 400 });
	}

	try {
		const selectedDate = dayjs(date);
		const dayNumber = selectedDate.day(); // Get day of week as a number (0-6)
		const dayName = dayMap[dayNumber]; // Returns short weekday name
		const now = dayjs();
		const isToday = selectedDate.isSame(now, 'day');

		// Use batch queries to fetch all data at once - optimized queries
		const [serviceResults, shifts, appointments] = await db.batch([
			// Query 1: Select only the service duration we need
			db
				.select({
					duration: serviceTable.duration
				})
				.from(serviceTable)
				.where(eq(serviceTable.id, +serviceId)), // Uses primary key

			// Query 2: Keep all fields for type safety, but optimize the join with index
			db
				.select({
					id: shiftPlanTable.id,
					employeeId: shiftPlanTable.employeeId,
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
					Lunch_to: shiftPlanTable.Lunch_to,
					employee: {
						id: employeeTable.id,
						name: employeeTable.name
					}
				})
				.from(shiftPlanTable)
				.innerJoin(employeeTable, eq(shiftPlanTable.employeeId, employeeTable.id)), // Uses shift_plan_employee_id_idx

			// Query 3: Optimize appointments query - select only needed fields
			db
				.select({
					id: appointmentTable.id,
					employeeId: appointmentTable.employeeId,
					time_from: appointmentTable.time_from,
					time_to: appointmentTable.time_to
				})
				.from(appointmentTable)
				.where(eq(appointmentTable.date, date)) // Uses appointment_date_idx
		]);

		// Check if service exists
		if (serviceResults.length === 0) {
			return json({ error: 'Service not found' }, { status: 404 });
		}

		const service = serviceResults[0];

		// Generate time slots more efficiently - only within business hours
		const timeSlots = generateBusinessHourTimeSlots();

		// Filter out past times if the selected date is today
		const currentTimeSlots = isToday
			? timeSlots.filter((time) => {
					const slotTime = dayjs(time, 'HH:mm');
					const bufferMinutes = 15;
					return slotTime.isAfter(now.add(bufferMinutes, 'minute'));
				})
			: timeSlots;

		// Initialize availability map
		const availabilityMap = new Map<string, Set<number>>();
		currentTimeSlots.forEach((time) => {
			availabilityMap.set(time, new Set<number>());
		});

		// Type-safe access to dynamic day properties
		const shiftsWithEmployees = shifts as ShiftWithEmployee[];

		// Pre-filter shifts by checking if the employee works on this day
		const workingShifts = shiftsWithEmployees.filter(
			(shift) => shift[`${dayName}_from`] && shift[`${dayName}_to`]
		);

		// Process each shift for availability
		workingShifts.forEach((shift) => {
			const shiftStart = shift[`${dayName}_from`] as string;
			const shiftEnd = shift[`${dayName}_to`] as string;

			// Skip shifts that don't work today
			if (!shiftStart || !shiftEnd) return;

			// Get appointments for this employee
			// Use pre-filter for better performance - filtering by employee ID
			const employeeAppointments = appointments.filter((a) => a.employeeId === shift.employeeId);

			currentTimeSlots.forEach((time) => {
				if (
					isTimeAvailable(time, {
						shiftStart,
						shiftEnd,
						breakStart: shift.Lunch_from || '',
						breakEnd: shift.Lunch_to || '',
						appointments: employeeAppointments,
						serviceDuration: service.duration
					})
				) {
					availabilityMap.get(time)?.add(shift.employeeId);
				}
			});
		});

		// Map time slots to response format
		const availableTimeSlots: TimeSlot[] = currentTimeSlots.map((time) => {
			const availableEmployees = availabilityMap.get(time) ?? new Set<number>();
			return {
				time,
				available: availableEmployees.size > 0,
				employeeIds: Array.from(availableEmployees)
			};
		});

		return json({ timeSlots: availableTimeSlots });
	} catch (error) {
		console.error('Error fetching time slots:', error);
		return json({ error: 'Failed to fetch time slots' }, { status: 500 });
	}
};

function parseTime(timeString: string): number {
	return dayjs(timeString, 'HH:mm').hour() * 60 + dayjs(timeString, 'HH:mm').minute();
}

function isTimeInRange(time: string, start: string, end: string): boolean {
	const timeObj = dayjs(time, 'HH:mm');
	const startObj = dayjs(start, 'HH:mm');
	const endObj = dayjs(end, 'HH:mm');
	return timeObj.isSameOrAfter(startObj) && timeObj.isBefore(endObj);
}

function isTimeOverlapping(
	time1Start: string,
	time1End: string,
	time2Start: string,
	time2End: string
): boolean {
	const t1s = parseTime(time1Start);
	const t1e = parseTime(time1End);
	const t2s = parseTime(time2Start);
	const t2e = parseTime(time2End);

	return t1s < t2e && t2s < t1e;
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
	return dayjs(startTime, 'HH:mm').add(durationMinutes, 'minute').format('HH:mm');
}

function isTimeAvailable(time: string, range: TimeRange): boolean {
	// Check if time is within shift
	if (!isTimeInRange(time, range.shiftStart, range.shiftEnd)) {
		return false;
	}

	// Calculate end time based on service duration
	const endTime = calculateEndTime(time, range.serviceDuration);

	// Check if service would extend beyond shift end
	if (parseTime(endTime) > parseTime(range.shiftEnd)) {
		return false;
	}

	// Check if appointment would overlap with break
	if (
		range.breakStart &&
		range.breakEnd &&
		isTimeOverlapping(time, endTime, range.breakStart, range.breakEnd)
	) {
		return false;
	}

	// Check if appointment would overlap with any existing appointments
	return !range.appointments.some((appt) =>
		isTimeOverlapping(time, endTime, appt.time_from, appt.time_to)
	);
}

// Generate time slots only for business hours (e.g., 8:00 - 20:00) instead of full 24 hours
function generateBusinessHourTimeSlots(): string[] {
	const slots: string[] = [];
	const startHour = 8; // 8:00 AM
	const endHour = 20; // 8:00 PM

	let currentTime = dayjs().startOf('day').add(startHour, 'hour');
	const endOfBusinessDay = dayjs().startOf('day').add(endHour, 'hour');

	while (currentTime.isBefore(endOfBusinessDay)) {
		slots.push(currentTime.format('HH:mm'));
		currentTime = currentTime.add(15, 'minute');
	}

	return slots;
}
