import { XMLBuilder, XMLParser } from 'fast-xml-parser';

import type { FETActivity, FETOutput } from '$lib/schema/fet';
import {
	getActiveTimetableDraftConstraintsByTimetableDraftId,
	getAllStudentGroupsByTimetableDraftId,
	getBuildingsBySchoolId,
	getEnhancedTimetableDraftActivitiesByTimetableDraftId,
	getSchoolById,
	getSpacesBySchoolId,
	getSubjectsBySchoolId,
	getTeacherSpecializationsByTeacherId,
	getTimetableDraftDaysByTimetableId,
	getTimetableDraftPeriodsByTimetableDraftId,
	getUsersBySchoolIdAndType
} from '$lib/server/db/service';

export type TimetableData = {
	timetableDays: Awaited<ReturnType<typeof getTimetableDraftDaysByTimetableId>>;
	timetablePeriods: Awaited<ReturnType<typeof getTimetableDraftPeriodsByTimetableDraftId>>;
	studentGroups: Awaited<ReturnType<typeof getAllStudentGroupsByTimetableDraftId>>;
	activities: Awaited<ReturnType<typeof getEnhancedTimetableDraftActivitiesByTimetableDraftId>>;
	buildings: Awaited<ReturnType<typeof getBuildingsBySchoolId>>;
	spaces: Awaited<ReturnType<typeof getSpacesBySchoolId>>;
	teachers: Awaited<ReturnType<typeof getUsersBySchoolIdAndType>>;
	subjects: Awaited<ReturnType<typeof getSubjectsBySchoolId>>;
	school: Awaited<ReturnType<typeof getSchoolById>>;
	activeConstraints: Awaited<
		ReturnType<typeof getActiveTimetableDraftConstraintsByTimetableDraftId>
	>;
};

export async function buildFETInput({
	timetableDays,
	timetablePeriods,
	studentGroups,
	activities,
	buildings,
	spaces,
	teachers,
	subjects,
	school,
	activeConstraints
}: TimetableData) {
	const daysList = timetableDays.map((day) => ({
		Name: day.id
	}));

	const hoursList = timetablePeriods.map((period) => ({
		Name: period.id
	}));

	const subjectsList = subjects.map((subject) => ({
		Name: subject.id
	}));

	// Use Promise.all to await all teacher specialization queries
	const teachersList = await Promise.all(
		teachers.map(async (teacher) => {
			const qualifiedSubjects = await getTeacherSpecializationsByTeacherId(teacher.id);
			// console.log(`Teacher ${teacher.id} qualified subjects:`, qualifiedSubjects);
			const subjectIds = qualifiedSubjects.map((qs) => qs.subjectId);

			return {
				Name: teacher.id,
				Target_Number_of_Hours: '',
				Qualified_Subjects:
					subjectIds.length > 0
						? {
								Qualified_Subject: subjectIds
							}
						: undefined
			};
		})
	);

	// studentGroups is now nested: Year -> Group -> Subgroup
	// It's already in the correct FET format from getStudentGroupsByTimetableId
	const studentsList = studentGroups;

	// Track the next Activity_Group_Id to use
	// let nextActivityGroupId = 1;

	const activitiesList = activities.flatMap((activity) => {
		// Collect all teacher IDs
		const teacherIds = activity.teacherIds;

		// Collect all student identifiers (groups, year levels, and individual students)
		const studentIdentifiers: string[] = [];

		// Add group IDs
		if (activity.groupIds.length > 0) {
			studentIdentifiers.push(...activity.groupIds.map((id) => 'G' + id.toString()));
		}

		// Add year levels
		if (activity.yearLevels.length > 0) {
			studentIdentifiers.push(...activity.yearLevels.map((yl) => 'Y' + yl.toString()));
		}

		// Add individual student IDs
		if (activity.studentIds.length > 0) {
			studentIdentifiers.push(...activity.studentIds.map((id) => 'S' + id.toString()));
		}

		// If no teachers or students assigned, skip this activity
		if (teacherIds.length === 0 || studentIdentifiers.length === 0) {
			console.warn(`Activity ${activity.id} skipped: missing teachers or students`);
			return [];
		}

		// Calculate how many split activities we need
		// If totalPeriods > periodsPerInstance, we create multiple activities (splits)
		const numberOfSplits = Math.ceil(activity.totalPeriods / activity.periodsPerInstance);

		// Create split activities
		const splitActivities = [];
		for (let i = 0; i < numberOfSplits; i++) {
			splitActivities.push({
				Teacher: teacherIds, // Array of teacher IDs - XML builder will create multiple <Teacher> tags
				Subject: activity.subjectId.toString(),
				Students: studentIdentifiers, // Array of student identifiers - XML builder will create multiple <Students> tags
				Duration: activity.periodsPerInstance, // Duration of this split
				Total_Duration: activity.totalPeriods, // Total duration across all splits
				Activity_Group_Id: activity.id, // Links all splits together by the same unique activity ID
				Active: true,
				Id: 0 // Placeholder - will be assigned later
			});
		}

		return splitActivities;
	});

	// Assign unique IDs to each activity
	activitiesList.forEach((activity, index) => {
		activity.Id = index + 1; // FET IDs typically start at 1
	});

	const buildingsList = buildings.map((building) => ({
		Name: building.id
	}));

	const roomsList = spaces.map((space) => {
		const building = buildings.find((b) => b.id === space.buildingId);

		return {
			Name: space.id,
			Building: building?.id || '',
			Capacity: space.capacity || 30,
			Virtual: false
		};
	});

	// Filter constraints by type
	const timeConstraints = activeConstraints.filter((c) => c.type === 'time');
	const spaceConstraints = activeConstraints.filter((c) => c.type === 'space');

	// Build Time_Constraints_List
	const timeConstraintsXML: Record<string, unknown> = {};
	timeConstraints.forEach((constraint) => {
		try {
			// Parse the JSON parameters
			const parsedParams =
				typeof constraint.parameters === 'string'
					? JSON.parse(constraint.parameters)
					: constraint.parameters;

			// Add to constraints using FET name
			timeConstraintsXML[constraint.FETName] = parsedParams;
		} catch (error) {
			console.error(`Error parsing time constraint ${constraint.FETName}:`, error);
		}
	});

	// Build Space_Constraints_List
	const spaceConstraintsXML: Record<string, unknown> = {};
	spaceConstraints.forEach((constraint) => {
		try {
			// Parse the JSON parameters
			const parsedParams =
				typeof constraint.parameters === 'string'
					? JSON.parse(constraint.parameters)
					: constraint.parameters;

			// Add to constraints using FET name
			spaceConstraintsXML[constraint.FETName] = parsedParams;
		} catch (error) {
			console.error(`Error parsing space constraint ${constraint.FETName}:`, error);
		}
	});

	// Generate ConstraintActivityPreferredRooms for activities with preferred spaces
	const preferredRoomsConstraints: Array<{
		Weight_Percentage: number;
		Activity_Id: number;
		Number_of_Preferred_Rooms: number;
		Preferred_Room: string[];
		Active: boolean;
		Comments: string;
	}> = [];

	// Group activities by their location preferences
	const activitiesWithLocations = activities.filter((activity) => activity.locationIds.length > 0);

	activitiesWithLocations.forEach((activity) => {
		// Find all activity instances for this activity in the activitiesList
		const activityInstances = activitiesList.filter(
			(act) => act.Subject === activity.subjectId.toString()
		);

		// For each instance, add a constraint with the preferred rooms
		activityInstances.forEach((activityInstance) => {
			preferredRoomsConstraints.push({
				Weight_Percentage: 95,
				Activity_Id: activityInstance.Id,
				Number_of_Preferred_Rooms: activity.locationIds.length,
				Preferred_Room: activity.locationIds.map((id) => id.toString()),
				Active: true,
				Comments: `Preferred rooms for activity ${activity.id}`
			});
		});
	});

	// Add the preferred rooms constraints to the space constraints
	if (preferredRoomsConstraints.length > 0) {
		spaceConstraintsXML['ConstraintActivityPreferredRooms'] = preferredRoomsConstraints;
	}

	const xmlData = {
		'?xml': {
			'@_version': '1.0',
			'@_encoding': 'UTF-8'
		},
		fet: {
			'@_version': '7.3.0',
			Institution_Name: school?.id || 'Unknown School',
			Comments:
				'This is a timetable generated for a school working with eddi. Full credit goes to Liviu Lalescu and Volker Dirr for their work on FET (Free Timetabling Software) which we utilise to generate the output.',
			Days_List: {
				Number_of_Days: daysList.length,
				Day: daysList
			},
			Hours_List: {
				Number_of_Hours: hoursList.length,
				Hour: hoursList
			},
			Subjects_List: {
				Subject: subjectsList
			},
			Activity_Tags_List: {},
			Teachers_List: {
				Teacher: teachersList
			},
			Students_List: {
				Year: studentsList
			},
			Activities_List: {
				Activity: activitiesList
			},
			Buildings_List: {
				Building: buildingsList
			},
			Rooms_List: {
				Room: roomsList
			},
			Time_Constraints_List: timeConstraintsXML,
			Space_Constraints_List: spaceConstraintsXML,
			Timetable_Generation_Options_List: {}
		}
	};

	const xmlBuilderOptions = {
		ignoreAttributes: false,
		format: true,
		suppressEmptyNode: true,
		attributeNamePrefix: '@_'
	};

	const builder = new XMLBuilder(xmlBuilderOptions);

	const xmlDataWithConstraints = builder.build(xmlData);

	// console.log(xmlDataWithConstraints);
	return xmlDataWithConstraints;
}

export function processFETOutput(fetOutput: string): FETActivity[] {
	try {
		const parser = new XMLParser();
		const fetObj = parser.parse(fetOutput) as FETOutput;

		// Debug: Log the structure to understand what we're getting
		console.log('FET Output structure keys:', Object.keys(fetObj));
		if (fetObj.fet) {
			console.log('FET object keys:', Object.keys(fetObj.fet));
		}

		// Check if the expected structure exists
		if (!fetObj.fet) {
			throw new Error('Invalid FET output: missing "fet" root element');
		}

		if (!fetObj.fet.Activities_List) {
			throw new Error('Invalid FET output: missing "Activities_List"');
		}

		const activities = fetObj.fet.Activities_List.Activity;
		const timeConstraints =
			fetObj.fet.Time_Constraints_List?.ConstraintActivityPreferredStartingTime || [];
		const spaceConstraints =
			fetObj.fet.Space_Constraints_List?.ConstraintActivityPreferredRoom || [];

		const activityMap = new Map<number, FETActivity>();
		activities.forEach((activity) => {
			activityMap.set(activity.Id, {
				Teacher: activity.Teacher,
				Subject: activity.Subject,
				Students: activity.Students,
				Room: 0,
				Day: 0,
				Period: 0,
				Duration: activity.Duration
			});
		});

		timeConstraints.forEach((constraint) => {
			const activity = activityMap.get(constraint.Activity_Id);
			if (activity) {
				activity.Day = constraint.Day;
				activity.Period = constraint.Hour;
			}
		});

		spaceConstraints.forEach((constraint) => {
			const activity = activityMap.get(constraint.Activity_Id);
			if (activity) {
				activity.Room = constraint.Room;
			}
		});

		return Array.from(activityMap.values());
	} catch (error) {
		console.error('Error processing FET output:', error);
		console.error('FET output content preview:', fetOutput.substring(0, 500));
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`Failed to process FET output: ${errorMessage}`);
	}
}
