import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../schema';
import postgres from 'postgres';
import seedrandom from 'seedrandom';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const rng = seedrandom('myconsistentseed');

export async function seed_student_timetable(
	user: schema.User,
	schoolLocations: schema.SchoolLocation[]
) {
	// P1: 0830-0940
	// P2: 0945-1025
	// Recess: 1030-1055
	// P3: 1100-1210
	// P4: 1215-1255
	// Lunch: 1300-1355
	// P5: 1400-1515
	const days = [
		schema.dayOfWeekEnum.monday,
		schema.dayOfWeekEnum.tuesday,
		schema.dayOfWeekEnum.wednesday,
		schema.dayOfWeekEnum.thursday,
		schema.dayOfWeekEnum.friday
	] as const;

	const timeOfDayAllocation = {
		P1: ['08:30:00', '01:10:00'],
		P2: ['09:45:00', '00:40:00'],
		P3: ['11:00:00', '01:10:00'],
		P4: ['12:15:00', '00:40:00'],
		P5: ['14:00:00', '01:15:00']
	} as const;

	const userSubjectClasses = await db
		.select()
		.from(schema.userSubjectClass)
		.where(eq(schema.userSubjectClass.userId, user.id));

	const allocationsToInsert = [];

	// For each school day, create a timetable entry for each user subject class
	for (const day of days) {
		// Create a fresh copy of available time slots for this day
		const availableTimeSlots = Object.entries(timeOfDayAllocation);

		console.log(`Allocating timetable for ${user.firstName} ${user.lastName} on ${day}`);
		for (const userSubjectClass of userSubjectClasses) {
			// If we've run out of time slots, skip remaining classes for this day
			if (availableTimeSlots.length === 0) {
				break;
			}

			const randomLocation = schoolLocations[Math.floor(rng() * schoolLocations.length)];

			// Pick a random time slot from available slots
			const randomTimeIndex = Math.floor(rng() * availableTimeSlots.length);
			const [, [startTime, duration]] = availableTimeSlots[randomTimeIndex];

			// Remove the used time slot from available slots
			availableTimeSlots.splice(randomTimeIndex, 1);
			console.log(
				`Allocating ${userSubjectClass.subjectClassId} at ${startTime} for ${duration} on ${day} at ${randomLocation.name}`
			);
			allocationsToInsert.push({
				subjectClassId: userSubjectClass.subjectClassId,
				schoolLocationId: randomLocation.id,
				dayOfWeek: day,
				startTime: startTime,
				duration: duration
			});
		}
	}

	// Insert all allocations at once
	const insertedAllocations = await db
		.insert(schema.subjectClassAllocation)
		.values(allocationsToInsert)
		.returning();

	console.log(
		`📅 Seeded ${insertedAllocations.length} timetable allocations for user ${user.firstName} ${user.lastName}`
	);

	return { allocations: insertedAllocations };
}
