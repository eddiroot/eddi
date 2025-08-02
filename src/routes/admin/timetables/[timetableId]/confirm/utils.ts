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
import { convertToFullName } from '$lib/utils';

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
		Name: day.id,
		Long_Name: `${day.timetableId}-${day.id}-${day.day}`
	}));

	const hoursList = timetablePeriods.map((period) => ({
		Name: period.id,
		Long_Name: `${period.timetableId}-${period.id}-${period.startTime}-${period.endTime}`
	}));

	const subjectsList = subjects.map((subject) => ({
		Name: subject.name,
		Long_Name: '',
		Code: '',
		Comments: ''
	}));

	const teachersList = teachers.map((teacher) => {
		const teacherActivities = activities.filter((activity) => activity.teacher.id === teacher.id);
		const qualifiedSubjects = [
			...new Set(teacherActivities.map((activity) => activity.subject.name))
		];

		const teacherName = convertToFullName(teacher.firstName, teacher.middleName, teacher.lastName);

		return {
			Name: teacher.id,
			Long_Name: teacherName,
			Code: '',
			Target_Number_of_Hours: '',
			Qualified_Subjects:
				qualifiedSubjects.length > 0
					? {
							Qualified_Subject: qualifiedSubjects
						}
					: undefined,
			Comments: ''
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
		Long_Name: '',
		Code: '',
		Number_of_Students: groups.reduce((sum, group) => sum + group.count, 0),
		Comments: '',
		Group: groups.map((group) => ({
			Name: group.name,
			Long_Name: '',
			Code: '',
			Number_of_Students: group.count,
			Comments: ''
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
		Name: building.name,
		Long_Name: '',
		Code: '',
		Comments: ''
	}));

	const roomsList = spaces.map((space) => {
		const building = buildings.find((b) => b.id === space.buildingId);

		return {
			Name: space.name,
			Building: building?.name || '',
			Capacity: space.capacity || 30,
			Virtual: false,
			Comments: ''
		};
	});

	const timeConstraints = [
		{
			ConstraintBasicCompulsoryTime: {
				Weight_Percentage: 100,
				Active: true,
				Comments: ''
			}
		}
	];

	const spaceConstraints = {
		ConstraintBasicCompulsorySpace: {
			Weight_Percentage: 100,
			Active: true,
			Comments: ''
		},
		ConstraintSubjectPreferredRooms: subjects.map((subject) => ({
			Weight_Percentage: 100,
			Subject: subject.name,
			Number_of_Preferred_Rooms: roomsList.length,
			Preferred_Room: roomsList.map((room) => room.Name),
			Active: true,
			Comments: ''
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
