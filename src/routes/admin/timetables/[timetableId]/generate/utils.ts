import { XMLBuilder, XMLParser } from 'fast-xml-parser';

import {
	getTimetableDays,
	getTimetablePeriods,
	getTimetableStudentGroupsWithCountsByTimetableId,
	getTimetableActivitiesByTimetableId,
	getBuildingsBySchoolId,
	getSpacesBySchoolId,
	getUsersBySchoolIdAndType,
	getSubjectsBySchoolId,
	getSchoolById
} from '$lib/server/db/service';
import type { FETActivity, FETOutput } from '$lib/server/schema/fetSchema';

export type TimetableData = {
	timetableDays: Awaited<ReturnType<typeof getTimetableDays>>;
	timetablePeriods: Awaited<ReturnType<typeof getTimetablePeriods>>;
	studentGroups: Awaited<ReturnType<typeof getTimetableStudentGroupsWithCountsByTimetableId>>;
	activities: Awaited<ReturnType<typeof getTimetableActivitiesByTimetableId>>;
	buildings: Awaited<ReturnType<typeof getBuildingsBySchoolId>>;
	spaces: Awaited<ReturnType<typeof getSpacesBySchoolId>>;
	teachers: Awaited<ReturnType<typeof getUsersBySchoolIdAndType>>;
	subjects: Awaited<ReturnType<typeof getSubjectsBySchoolId>>;
	school: Awaited<ReturnType<typeof getSchoolById>>;
};

export function buildFETInput({
	timetableDays,
	timetablePeriods,
	studentGroups,
	activities,
	buildings,
	spaces,
	teachers,
	subjects,
	school
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

	const teachersList = teachers.map((teacher) => {
		const teacherActivities = activities.filter((activity) => activity.teacher.id === teacher.id);
		const qualifiedSubjects = [
			...new Set(teacherActivities.map((activity) => activity.subject.id))
		];

		return {
			Name: teacher.id,
			Target_Number_of_Hours: '',
			Qualified_Subjects:
				qualifiedSubjects.length > 0
					? {
							Qualified_Subject: qualifiedSubjects
						}
					: undefined
		};
	});

	const groupsByYearLevel = studentGroups.reduce(
		(acc, group) => {
			if (!acc[group.yearLevel]) {
				acc[group.yearLevel] = [];
			}
			acc[group.yearLevel].push(group);
			return acc;
		},
		{} as Record<string, typeof studentGroups>
	);

	const studentsList = Object.entries(groupsByYearLevel).map(([yearLevel, groups]) => ({
		Name: yearLevel,
		Number_of_Students: groups.reduce((sum, group) => sum + group.count, 0),
		Group: groups.map((group) => ({
			Name: group.id,
			Number_of_Students: group.count
		}))
	}));

	const activitiesList = activities.map((activity) => {
		const activityTemplate = {
			Teacher: activity.teacher.id,
			Subject: activity.subject.id,
			Students: activity.studentGroup.id,
			Duration: activity.activity.periodsPerInstance,
			Total_Duration: activity.activity.totalPeriods,
			Activity_Group_Id: 0,
			Active: true,
			Id: 0 // Placeholder for later assignment
		};

		return Array.from({ length: activity.activity.totalPeriods }, () => ({ ...activityTemplate }));
	});

	// For loop over the nested array structure to add IDs to each activity
	for (let i = 0; i < activitiesList.length; i++) {
		for (let j = 0; j < activitiesList[i].length; j++) {
			activitiesList[i][j].Id = i * activitiesList[i].length + j;
		}
	}

	const constraintMinDaysBetweenActivities = activitiesList.map((activities) => ({
		Weight_Percentage: 100,
		Consecutive_If_Same_Day: true,
		Number_of_Activities: activities.length,
		Activity_Id: activities.map((activity) => activity.Id),
		MinDays: 1,
		Active: true
	}));

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

	const timeConstraints = {
		ConstraintBasicCompulsoryTime: {
			Weight_Percentage: 100,
			Active: true
		},
		ConstraintMinDaysBetweenActivities: constraintMinDaysBetweenActivities
	};

	const spaceConstraints = {
		ConstraintBasicCompulsorySpace: {
			Weight_Percentage: 100,
			Active: true
		},
		ConstraintSubjectPreferredRooms: subjects.map((subject) => ({
			Weight_Percentage: 100,
			Subject: subject.id,
			Number_of_Preferred_Rooms: roomsList.length,
			Preferred_Room: roomsList.map((room) => room.Name),
			Active: true
		}))
	};

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
				Activity: activitiesList.flatMap((activity) => activity)
			},
			Buildings_List: {
				Building: buildingsList
			},
			Rooms_List: {
				Room: roomsList
			},
			Time_Constraints_List: timeConstraints,
			Space_Constraints_List: spaceConstraints,
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
	return builder.build(xmlData);
}

export function processFETOutput(fetOutput: string): FETActivity[] {
	const parser = new XMLParser();
	const fetObj = parser.parse(fetOutput) as FETOutput;

	const activities = fetObj.fet.Activities_List.Activity;
	const timeConstraints =
		fetObj.fet.Time_Constraints_List.ConstraintActivityPreferredStartingTime || [];
	const spaceConstraints = fetObj.fet.Space_Constraints_List.ConstraintActivityPreferredRoom || [];

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
}
