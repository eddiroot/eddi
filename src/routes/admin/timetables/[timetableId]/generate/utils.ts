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

export function buildFETXML({
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
		Name: subject.name
	}));

	const teachersList = teachers.map((teacher) => {
		const teacherActivities = activities.filter((activity) => activity.teacher.id === teacher.id);
		const qualifiedSubjects = [
			...new Set(teacherActivities.map((activity) => activity.subject.name))
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
			Name: group.name,
			Number_of_Students: group.count
		}))
	}));

	const activitiesListWithoutIds = activities.flatMap((activity) => {
		const activities = [];
		for (let i = 0; i < activity.activity.totalPeriods; i++) {
			activities.push({
				Teacher: activity.teacher.id,
				Subject: activity.subject.name,
				Students: activity.studentGroup.name,
				Duration: activity.activity.periodsPerInstance,
				Total_Duration: activity.activity.totalPeriods,
				Activity_Group_Id: 0,
				Active: true,
				Comments: ''
			});
		}
		return activities;
	});

	const activitiesList = activitiesListWithoutIds.map((activity, index) => ({
		...activity,
		Id: index
	}));

	const buildingsList = buildings.map((building) => ({
		Name: building.name
	}));

	const roomsList = spaces.map((space) => {
		const building = buildings.find((b) => b.id === space.buildingId);

		return {
			Name: space.name,
			Building: building?.name || '',
			Capacity: space.capacity || 30,
			Virtual: false
		};
	});

	const timeConstraints = [
		{
			ConstraintBasicCompulsoryTime: {
				Weight_Percentage: 100,
				Active: true
			}
		}
	];

	const spaceConstraints = {
		ConstraintBasicCompulsorySpace: {
			Weight_Percentage: 100,
			Active: true
		},
		ConstraintSubjectPreferredRooms: subjects.map((subject) => ({
			Weight_Percentage: 100,
			Subject: subject.name,
			Number_of_Preferred_Rooms: roomsList.length,
			Preferred_Room: roomsList.map((room) => room.Name),
			Active: true
		}))
	};

	return {
		'?xml': {
			'@_version': '1.0',
			'@_encoding': 'UTF-8'
		},
		fet: {
			'@_version': '7.3.0',
			Institution_Name: school?.name || 'eddi Grammar',
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
			Time_Constraints_List: timeConstraints,
			Space_Constraints_List: spaceConstraints,
			Timetable_Generation_Options_List: {}
		}
	};
}
