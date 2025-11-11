import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export interface UserStatistics {
	userId: string;
	userName: string;
	userType: string;
	totalHoursPerCycle: number;
	averageHoursPerDay: number;
	maxHoursPerDay: number;
	minHoursPerDay: number;
	numberOfFreeDays: number;
	dailyHours: Map<number, number>; // dayId -> hours
}

interface TimetableStatistics {
	timetableDraftId: number;
	totalDays: number;
	totalPeriods: number;
	userStatistics: UserStatistics[];
	generatedAt: Date;
}

export async function processStatistics(timetableDraftId: number): Promise<TimetableStatistics> {
	// Get all FET activities for this draft
	const fetActivities = await db
		.select()
		.from(table.fetActivity)
		.where(and(eq(table.fetActivity.timetableDraftId, timetableDraftId)));

	if (fetActivities.length === 0) {
		return {
			timetableDraftId,
			totalDays: 0,
			totalPeriods: 0,
			userStatistics: [],
			generatedAt: new Date()
		};
	}

	// Get all timetable periods to calculate actual duration in minutes
	const allTimetablePeriods = await db
		.select()
		.from(table.timetablePeriod)
		.where(eq(table.timetablePeriod.timetableDraftId, timetableDraftId));

	// Create a map of periodId -> period data for quick lookup
	const periodMap = new Map(allTimetablePeriods.map((p) => [p.id, p]));

	// Helper function to calculate actual duration in minutes for an activity
	// by traversing the period chain using nextPeriodId
	function calculateActivityDurationInMinutes(
		startPeriodId: number,
		numberOfPeriods: number
	): number {
		const firstPeriod = periodMap.get(startPeriodId);
		if (!firstPeriod) {
			console.warn(
				`⚠️ [STATISTICS PROCESSOR] Start period ${startPeriodId} not found in period map`
			);
			return 0;
		}

		// If activity only spans 1 period, use its duration directly
		if (numberOfPeriods === 1) {
			return firstPeriod.duration ?? 0;
		}

		// For activities spanning multiple periods, traverse to find the last period
		let currentPeriodId: number | null = startPeriodId;
		let periodsProcessed = 0;
		let lastPeriod = firstPeriod;

		while (currentPeriodId !== null && periodsProcessed < numberOfPeriods) {
			const period = periodMap.get(currentPeriodId);
			if (!period) {
				console.warn(`⚠️ [STATISTICS PROCESSOR] Period ${currentPeriodId} not found in period map`);
				break;
			}

			lastPeriod = period;
			periodsProcessed++;

			// Move to next period in the chain
			currentPeriodId = period.nextPeriodId;
		}

		if (periodsProcessed < numberOfPeriods) {
			console.warn(
				`⚠️ [STATISTICS PROCESSOR] Activity spans ${numberOfPeriods} periods but only ${periodsProcessed} periods were found in the chain`
			);
		}

		// Calculate total duration as: end time of last period - start time of first period
		// Parse time strings in format "HH:MM"
		const [startHours, startMinutes] = firstPeriod.startTime.split(':').map(Number);
		const [endHours, endMinutes] = lastPeriod.endTime.split(':').map(Number);

		const startTotalMinutes = startHours * 60 + startMinutes;
		const endTotalMinutes = endHours * 60 + endMinutes;

		return endTotalMinutes - startTotalMinutes;
	}

	// Get all user-activity associations for these activities
	const activityIds = fetActivities.map((a) => a.id);
	const userActivities = await db
		.select({
			fetActivityId: table.userFetActivity.fetActivityId,
			userId: table.userFetActivity.userId,
			firstName: table.user.firstName,
			lastName: table.user.lastName,
			userType: table.user.type
		})
		.from(table.userFetActivity)
		.innerJoin(table.user, eq(table.userFetActivity.userId, table.user.id))
		.where(inArray(table.userFetActivity.fetActivityId, activityIds));

	console.log(
		`👥 [STATISTICS PROCESSOR] Found ${userActivities.length} user-activity associations`
	);

	// Get timetable days to know total days in cycle
	const timetableDays = await db
		.select()
		.from(table.timetableDay)
		.where(eq(table.timetableDay.timetableDraftId, timetableDraftId));

	// Get timetable periods to know total periods per day
	const timetablePeriods = await db
		.select()
		.from(table.timetablePeriod)
		.where(eq(table.timetablePeriod.timetableDraftId, timetableDraftId));

	const totalDays = timetableDays.length;
	const totalPeriods = timetablePeriods.length;

	console.log(
		`📅 [STATISTICS PROCESSOR] Timetable has ${totalDays} days and ${totalPeriods} periods per day`
	);

	// Create a map of activityId -> activity data
	const activityMap = new Map(fetActivities.map((a) => [a.id, a]));

	// Group user activities by userId
	const userActivityMap = new Map<string, Array<(typeof userActivities)[0]>>();
	for (const ua of userActivities) {
		if (!userActivityMap.has(ua.userId)) {
			userActivityMap.set(ua.userId, []);
		}
		userActivityMap.get(ua.userId)!.push(ua);
	}

	// Calculate statistics for each user
	const userStatistics: UserStatistics[] = [];

	for (const [userId, activities] of userActivityMap.entries()) {
		const userName = `${activities[0].firstName} ${activities[0].lastName}`;
		const userType = activities[0].userType;

		// Map to track hours per day: dayId -> total hours
		const dailyHoursMap = new Map<number, number>();

		// Initialize all days with 0 hours
		for (const day of timetableDays) {
			dailyHoursMap.set(day.day, 0);
		}

		// Calculate total hours for each day
		for (const userActivity of activities) {
			const activity = activityMap.get(userActivity.fetActivityId);
			if (!activity) continue;

			// Calculate actual duration in minutes by traversing the period chain
			const durationInMinutes = calculateActivityDurationInMinutes(
				activity.period,
				activity.duration
			);
			const durationInHours = durationInMinutes / 60;

			const currentHours = dailyHoursMap.get(activity.day) || 0;
			dailyHoursMap.set(activity.day, currentHours + durationInHours);
		}

		// Calculate statistics
		const dailyHoursArray = Array.from(dailyHoursMap.values());
		const totalHoursPerCycle = dailyHoursArray.reduce((sum, hours) => sum + hours, 0);
		const daysWithClasses = dailyHoursArray.filter((hours) => hours > 0).length;
		const numberOfFreeDays = totalDays - daysWithClasses;

		// Calculate average hours per day (only for days with classes)
		const averageHoursPerDay = daysWithClasses > 0 ? totalHoursPerCycle / daysWithClasses : 0;

		// Find max and min hours per day (excluding free days)
		const hoursOnWorkingDays = dailyHoursArray.filter((hours) => hours > 0);
		const maxHoursPerDay = hoursOnWorkingDays.length > 0 ? Math.max(...hoursOnWorkingDays) : 0;
		const minHoursPerDay = hoursOnWorkingDays.length > 0 ? Math.min(...hoursOnWorkingDays) : 0;

		userStatistics.push({
			userId,
			userName,
			userType,
			totalHoursPerCycle,
			averageHoursPerDay: parseFloat(averageHoursPerDay.toFixed(2)),
			maxHoursPerDay,
			minHoursPerDay,
			numberOfFreeDays,
			dailyHours: dailyHoursMap
		});

		console.log(
			`👤 [STATISTICS PROCESSOR] User ${userName}: ${totalHoursPerCycle}h total, avg ${averageHoursPerDay.toFixed(2)}h/day, ${numberOfFreeDays} free days`
		);
	}

	// Sort by user type then by name
	userStatistics.sort((a, b) => {
		if (a.userType !== b.userType) {
			return a.userType.localeCompare(b.userType);
		}
		return a.userName.localeCompare(b.userName);
	});

	const statistics: TimetableStatistics = {
		timetableDraftId,
		totalDays,
		totalPeriods: totalPeriods,
		userStatistics,
		generatedAt: new Date()
	};

	console.log(
		`✅ [STATISTICS PROCESSOR] Statistics processing complete for ${userStatistics.length} users`
	);

	return statistics;
}
