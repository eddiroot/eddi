/**
 * Parse CSV timetable output and populate fetActivity and userFetActivity tables
 */
export async function parseTimetableCSVAndPopulate(
	csvContent: string,
	timetableId: number,
	iterationId: number
) {
	const { db } = await import('$lib/server/db');
	const table = await import('$lib/server/db/schema');
	const { eq } = await import('drizzle-orm');
	const { userTypeEnum } = await import('$lib/enums');

	// Parse CSV content
	const lines = csvContent.trim().split('\n');
	if (lines.length < 2) {
		throw new Error('CSV file is empty or invalid');
	}

	// Parse header to get column indices
	const header = lines[0].split(',').map((col) => col.replace(/"/g, '').trim());
	const activityIdIdx = header.indexOf('Activity Id');
	const dayIdx = header.indexOf('Day');
	const hourIdx = header.indexOf('Hour');
	const studentsIdx = header.indexOf('Students Sets');
	const subjectIdx = header.indexOf('Subject');
	const teachersIdx = header.indexOf('Teachers');
	const roomIdx = header.indexOf('Room');

	if (
		activityIdIdx === -1 ||
		dayIdx === -1 ||
		hourIdx === -1 ||
		studentsIdx === -1 ||
		subjectIdx === -1 ||
		teachersIdx === -1 ||
		roomIdx === -1
	) {
		throw new Error('CSV file is missing required columns');
	}

	// Group activities by Activity Id
	interface ActivityData {
		activityId: string;
		day: number;
		hour: number;
		students: string;
		subject: number;
		teacher: string;
		room: number;
		occurrences: number;
	}

	const activityMap = new Map<string, ActivityData>();

	// Parse data rows (skip header)
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		// Parse CSV line (handle quoted values)
		const values: string[] = [];
		let current = '';
		let inQuotes = false;

		for (let j = 0; j < line.length; j++) {
			const char = line[j];
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				values.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		values.push(current.trim());

		const activityId = values[activityIdIdx];
		if (!activityId) continue;

		if (activityMap.has(activityId)) {
			// Increment duration for existing activity
			activityMap.get(activityId)!.occurrences++;
		} else {
			// Create new activity entry
			activityMap.set(activityId, {
				activityId,
				day: parseInt(values[dayIdx], 10),
				hour: parseInt(values[hourIdx], 10),
				students: values[studentsIdx],
				subject: parseInt(values[subjectIdx], 10),
				teacher: values[teachersIdx],
				room: parseInt(values[roomIdx], 10) || 0,
				occurrences: 1
			});
		}
	}

	// Get timetable to find schoolId
	const [timetableData] = await db
		.select({ schoolId: table.timetable.schoolId })
		.from(table.timetable)
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	if (!timetableData) {
		throw new Error(`Timetable ${timetableId} not found`);
	}

	const schoolId = timetableData.schoolId;

	// Get all students from the school for year level lookups
	const allStudents = await db
		.select({
			id: table.user.id,
			yearLevel: table.user.yearLevel
		})
		.from(table.user)
		.where(
			eq(table.user.schoolId, schoolId) &&
				eq(table.user.type, userTypeEnum.student) &&
				eq(table.user.isArchived, false)
		);

	// Get all timetable groups with their members
	const groupMembers = await db
		.select({
			groupId: table.timetableGroupMember.groupId,
			userId: table.timetableGroupMember.userId
		})
		.from(table.timetableGroupMember)
		.innerJoin(
			table.timetableGroup,
			eq(table.timetableGroupMember.groupId, table.timetableGroup.id)
		)
		.where(eq(table.timetableGroup.timetableId, timetableId));

	// Create a map of groupId -> userIds
	const groupToUsersMap = new Map<number, string[]>();
	for (const member of groupMembers) {
		if (!groupToUsersMap.has(member.groupId)) {
			groupToUsersMap.set(member.groupId, []);
		}
		groupToUsersMap.get(member.groupId)!.push(member.userId);
	}

	// Create a map of yearLevel -> userIds
	const yearToUsersMap = new Map<string, string[]>();
	for (const student of allStudents) {
		if (!yearToUsersMap.has(student.yearLevel)) {
			yearToUsersMap.set(student.yearLevel, []);
		}
		yearToUsersMap.get(student.yearLevel)!.push(student.id);
	}

	// Process each unique activity
	const fetActivitiesToInsert: Array<typeof table.fetActivity.$inferInsert> = [];
	const userFetActivitiesToInsert: Array<typeof table.userFetActivity.$inferInsert> = [];

	for (const [, activityData] of activityMap.entries()) {
		// Create fetActivity record
		const fetActivityInsert = {
			timetableId,
			iterationId,
			subjectId: activityData.subject,
			spaceId: activityData.room,
			day: activityData.day,
			period: activityData.hour,
			duration: activityData.occurrences
		};

		fetActivitiesToInsert.push(fetActivityInsert);

		// Parse student identifiers - handle multiple students separated by '+'
		const studentIdentifiers = activityData.students.split('+').map((s) => s.trim());
		const userIds = new Set<string>();

		for (const identifier of studentIdentifiers) {
			if (identifier.startsWith('Y')) {
				// Year level - remove 'Y' prefix
				const yearLevel = identifier.substring(1);
				const studentsInYear = yearToUsersMap.get(yearLevel) || [];
				studentsInYear.forEach((userId) => userIds.add(userId));
			} else if (identifier.startsWith('G')) {
				// Group - remove 'G' prefix
				const groupId = parseInt(identifier.substring(1), 10);
				const studentsInGroup = groupToUsersMap.get(groupId) || [];
				studentsInGroup.forEach((userId) => userIds.add(userId));
			} else if (identifier.startsWith('S')) {
				// Individual student - remove 'S' prefix
				const studentId = identifier.substring(1);
				userIds.add(studentId);
			}
		}

		// Add teacher(s) to the activity - handle multiple teachers separated by '+'
		if (activityData.teacher) {
			const teacherIds = activityData.teacher.split('+').map((t) => t.trim());
			teacherIds.forEach((teacherId) => {
				if (teacherId) {
					userIds.add(teacherId);
				}
			});
		}

		// Store user IDs for this activity (will be linked after insertion)
		// We'll need to track the activity index to link users after bulk insert
		const activityIndex = fetActivitiesToInsert.length - 1;
		userIds.forEach((userId) => {
			userFetActivitiesToInsert.push({
				fetActivityId: activityIndex, // Temporary - will be replaced with actual DB ID
				userId
			});
		});
	}

	// Insert fetActivities in batches
	const batchSize = 100;
	const insertedFetActivityIds: number[] = [];

	for (let i = 0; i < fetActivitiesToInsert.length; i += batchSize) {
		const batch = fetActivitiesToInsert.slice(i, i + batchSize);
		const inserted = await db
			.insert(table.fetActivity)
			.values(batch)
			.returning({ id: table.fetActivity.id });
		insertedFetActivityIds.push(...inserted.map((r) => r.id));
	}

	// Now update userFetActivitiesToInsert with actual fetActivity IDs
	const finalUserFetActivities: Array<typeof table.userFetActivity.$inferInsert> = [];
	for (const userActivity of userFetActivitiesToInsert) {
		const actualFetActivityId = insertedFetActivityIds[userActivity.fetActivityId as number];
		if (actualFetActivityId) {
			finalUserFetActivities.push({
				fetActivityId: actualFetActivityId,
				userId: userActivity.userId
			});
		}
	}

	// Insert userFetActivities in batches
	for (let i = 0; i < finalUserFetActivities.length; i += batchSize) {
		const batch = finalUserFetActivities.slice(i, i + batchSize);
		await db.insert(table.userFetActivity).values(batch);
	}

	console.log(`Successfully inserted ${insertedFetActivityIds.length} FET activities`);
	console.log(`Successfully inserted ${finalUserFetActivities.length} user-activity associations`);

	return {
		activitiesInserted: insertedFetActivityIds.length,
		userActivitiesInserted: finalUserFetActivities.length
	};
}

/**
 * Example usage:
 *
 * ```typescript
 * import { parseTimetableCSVAndPopulate } from './utils';
 *
 * // Read CSV file content
 * const fs = await import('fs/promises');
 * const csvContent = await fs.readFile('path/to/timetable.csv', 'utf-8');
 *
 * // Parse and populate database
 * const result = await parseTimetableCSVAndPopulate(
 *   csvContent,
 *   1000, // timetableId
 *   1001  // iterationId
 * );
 *
 * console.log(`Inserted ${result.activitiesInserted} activities`);
 * console.log(`Created ${result.userActivitiesInserted} user associations`);
 * ```
 */
