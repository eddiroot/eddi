import { constraintTypeEnum } from '../../../../enums';

export interface ConstraintDefinition {
	FETName: string;
	friendlyName: string;
	description: string;
	type: constraintTypeEnum;
	optional: boolean; // whether this constraint is optional or mandatory
	repeatable: boolean; // whether this constraint can be added multiple times
}

export const TIME_CONSTRAINTS: ConstraintDefinition[] = [
	{
		FETName: 'ConstraintBasicCompulsoryTime',
		friendlyName: 'Basic Compulsory Time',
		description:
			'Ensures all activities are scheduled within the defined time periods. This is a mandatory constraint.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintStudentsMaxGapsPerWeek',
		friendlyName: 'Students Max Gaps Per Week',
		description: 'Limits the maximum number of free periods (gaps) students can have per week.',
		type: constraintTypeEnum.time,
		optional: true,
		repeatable: true
	},
	{
		FETName: 'ConstraintMinDaysBetweenActivities',
		friendlyName: 'Minimum Days Between Activities',
		description: 'Ensures a minimum number of days between specific activities.',
		type: constraintTypeEnum.time,
		optional: true,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeacherNotAvailableTimes',
		friendlyName: 'Teacher Not Available Times',
		description: 'Specifies when a teacher is not available for teaching.',
		type: constraintTypeEnum.time,
		optional: true,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeacherMaxDaysPerWeek',
		friendlyName: 'Teacher Max Days Per Week',
		description: 'Limits the maximum number of days per week a teacher can work.',
		type: constraintTypeEnum.time,
		optional: true,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeachersMaxGapsPerWeek',
		friendlyName: 'Teachers Max Gaps Per Week',
		description: 'Limits the maximum number of free periods (gaps) teachers can have per week.',
		type: constraintTypeEnum.time,
		optional: true,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivityPreferredStartingTime',
		friendlyName: 'Activity Preferred Starting Time',
		description: 'Sets a preferred starting time for a specific activity.',
		type: constraintTypeEnum.time,
		optional: true,
		repeatable: true
	}
];

export const SPACE_CONSTRAINTS: ConstraintDefinition[] = [
	{
		FETName: 'ConstraintBasicCompulsorySpace',
		friendlyName: 'Basic Compulsory Space',
		description:
			'Ensures all activities are assigned to appropriate spaces. This is a mandatory constraint.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintRoomNotAvailableTimes',
		friendlyName: 'Room Not Available Times',
		description: 'Specifies when a room is not available for use.',
		type: constraintTypeEnum.space,
		optional: true,
		repeatable: true
	},
	{
		FETName: 'ConstraintSubjectPreferredRoom',
		friendlyName: 'Subject Preferred Room',
		description: 'Assigns a preferred room for a specific subject.',
		type: constraintTypeEnum.space,
		optional: true,
		repeatable: true
	},
	{
		FETName: 'ConstraintSubjectPreferredRooms',
		friendlyName: 'Subject Preferred Rooms',
		description: 'Assigns multiple preferred rooms for a specific subject.',
		type: constraintTypeEnum.space,
		optional: true,
		repeatable: true
	}
];

export const ALL_CONSTRAINTS = [...TIME_CONSTRAINTS, ...SPACE_CONSTRAINTS];
