// Constraint Types and Data Structures for Timetabling System

// Enums for constraint categories
export enum ConstraintCategory {
	TIME = 'Time',
	SPACE = 'Space'
}

// Enum for all constraint types
export enum ConstraintType {
	// Time Constraints
	BASIC_COMPULSORY_TIME = 'ConstraintBasicCompulsoryTime',
	STUDENTS_SET_NOT_AVAILABLE_TIMES = 'ConstraintStudentsSetNotAvailableTimes',
	MIN_DAYS_BETWEEN_ACTIVITIES = 'ConstraintMinDaysBetweenActivities',
	ACTIVITIES_PREFERRED_STARTING_TIMES = 'ConstraintActivitiesPreferredStartingTimes',
	TEACHER_NOT_AVAILABLE_TIMES = 'ConstraintTeacherNotAvailableTimes',
	TEACHER_MAX_GAPS_PER_DAY = 'ConstraintTeacherMaxGapsPerDay',
	BREAK_TIMES = 'ConstraintBreakTimes',
	TEACHER_MAX_HOURS_DAILY = 'ConstraintTeacherMaxHoursDaily',
	ACTIVITY_PREFERRED_TIME_SLOTS = 'ConstraintActivityPreferredTimeSlots',
	ACTIVITIES_SAME_STARTING_TIME = 'ConstraintActivitiesSameStartingTime',
	ACTIVITIES_NOT_OVERLAPPING = 'ConstraintActivitiesNotOverlapping',
	ACTIVITIES_OCCUPY_MAX_DIFFERENT_ROOMS = 'ConstraintActivitiesOccupyMaxDifferentRooms',
	ACTIVITIES_PREFERRED_TIME_SLOTS = 'ConstraintActivitiesPreferredTimeSlots',
	ACTIVITIES_SAME_ROOM_IF_CONSECUTIVE = 'ConstraintActivitiesSameRoomIfConsecutive',
	MIN_GAPS_BETWEEN_ACTIVITIES = 'ConstraintMinGapsBetweenActivities',
	TWO_ACTIVITIES_CONSECUTIVE = 'ConstraintTwoActivitiesConsecutive',

	// Space Constraints
	BASIC_COMPULSORY_SPACE = 'ConstraintBasicCompulsorySpace',
	TEACHER_HOME_ROOM = 'ConstraintTeacherHomeRoom',
	ACTIVITY_PREFERRED_ROOM = 'ConstraintActivityPreferredRoom',
	ACTIVITY_PREFERRED_ROOMS = 'ConstraintActivityPreferredRooms',
	STUDENTS_SET_HOME_ROOM = 'ConstraintStudentsSetHomeRoom',
	SUBJECT_ACTIVITY_TAG_PREFERRED_ROOM = 'ConstraintSubjectActivityTagPreferredRoom',
	SUBJECT_PREFERRED_ROOMS = 'ConstraintSubjectPreferredRooms'
}

// Common types
export interface TimeSlot {
	day: number;
	hour: number;
}

export interface NotAvailableTime {
	day: number;
	hour: number;
}

export interface PreferredStartingTime {
	day: number;
	hour: number;
}

export interface BreakTime {
	day: number;
	hour: number;
}

// Base constraint interface
export interface BaseConstraint {
	id: string;
	type: ConstraintType;
	category: ConstraintCategory;
	weight: number; // 0-100, where 100 means must be respected
	active: boolean;
	description?: string;
}

// Time Constraint Parameter Interfaces
export interface BasicCompulsoryTimeParams {
	// No specific parameters - this is a basic constraint
	readonly _type?: 'BasicCompulsoryTime';
}

export interface StudentsSetNotAvailableTimesParams {
	students: string;
	numberOfNotAvailableTimes: number;
	notAvailableTimes: NotAvailableTime[];
}

export interface MinDaysBetweenActivitiesParams {
	consecutiveIfSameDay: boolean;
	numberOfActivities: number;
	activityIds: string[];
	minDays: number;
}

export interface ActivitiesPreferredStartingTimesParams {
	teacherName?: string;
	studentsName?: string;
	subjectName?: string;
	activityTagName?: string;
	duration: number;
	numberOfPreferredStartingTimes: number;
	preferredStartingTimes: PreferredStartingTime[];
}

export interface TeacherNotAvailableTimesParams {
	teacher: string;
	numberOfNotAvailableTimes: number;
	notAvailableTimes: NotAvailableTime[];
}

export interface TeacherMaxGapsPerDayParams {
	teacherName: string;
	maxGaps: number;
}

export interface BreakTimesParams {
	numberOfBreakTimes: number;
	breakTimes: BreakTime[];
}

export interface TeacherMaxHoursDailyParams {
	teacher: string;
	maximumHoursDaily: number;
}

export interface ActivityPreferredTimeSlotsParams {
	activityId: string;
	numberOfPreferredTimeSlots: number;
	preferredTimeSlots: TimeSlot[];
}

export interface ActivitiesSameStartingTimeParams {
	numberOfActivities: number;
	activityIds: string[];
}

export interface ActivitiesNotOverlappingParams {
	numberOfActivities: number;
	activityIds: string[];
}

export interface ActivitiesOccupyMaxDifferentRoomsParams {
	numberOfActivities: number;
	activityIds: string[];
	maxNumberOfDifferentRooms: number;
}

export interface ActivitiesPreferredTimeSlotsParams {
	teacher?: string;
	students?: string;
	subject?: string;
	activityTag?: string;
	duration: number;
	numberOfPreferredTimeSlots: number;
	preferredTimeSlots: TimeSlot[];
}

export interface ActivitiesSameRoomIfConsecutiveParams {
	numberOfActivities: number;
	activityIds: string[];
}

export interface MinGapsBetweenActivitiesParams {
	numberOfActivities: number;
	activityIds: string[];
	minGaps: number;
}

export interface TwoActivitiesConsecutiveParams {
	firstActivityId: string;
	secondActivityId: string;
}

// Space Constraint Parameter Interfaces
export interface BasicCompulsorySpaceParams {
	// No specific parameters - this is a basic constraint
	readonly _type?: 'BasicCompulsorySpace';
}

export interface TeacherHomeRoomParams {
	teacher: string;
	room: string;
}

export interface ActivityPreferredRoomParams {
	activityId: string;
	room: string;
	permanentlyLocked: boolean;
}

export interface ActivityPreferredRoomsParams {
	activityId: string;
	numberOfPreferredRooms: number;
	preferredRooms: string[];
}

export interface StudentsSetHomeRoomParams {
	students: string;
	room: string;
}

export interface SubjectActivityTagPreferredRoomParams {
	subject: string;
	activityTag: string;
	room: string;
}

export interface SubjectPreferredRoomsParams {
	subject: string;
	numberOfPreferredRooms: number;
	preferredRooms: string[];
}

// Union type for all constraint parameters
export type ConstraintParams =
	// Time Constraints
	| BasicCompulsoryTimeParams
	| StudentsSetNotAvailableTimesParams
	| MinDaysBetweenActivitiesParams
	| ActivitiesPreferredStartingTimesParams
	| TeacherNotAvailableTimesParams
	| TeacherMaxGapsPerDayParams
	| BreakTimesParams
	| TeacherMaxHoursDailyParams
	| ActivityPreferredTimeSlotsParams
	| ActivitiesSameStartingTimeParams
	| ActivitiesNotOverlappingParams
	| ActivitiesOccupyMaxDifferentRoomsParams
	| ActivitiesPreferredTimeSlotsParams
	| ActivitiesSameRoomIfConsecutiveParams
	| MinGapsBetweenActivitiesParams
	| TwoActivitiesConsecutiveParams
	// Space Constraints
	| BasicCompulsorySpaceParams
	| TeacherHomeRoomParams
	| ActivityPreferredRoomParams
	| ActivityPreferredRoomsParams
	| StudentsSetHomeRoomParams
	| SubjectActivityTagPreferredRoomParams
	| SubjectPreferredRoomsParams;

// Generic constraint interface
export interface Constraint<T extends ConstraintParams = ConstraintParams> extends BaseConstraint {
	parameters: T;
}

// Specific constraint types
export type BasicCompulsoryTimeConstraint = Constraint<BasicCompulsoryTimeParams> & {
	type: ConstraintType.BASIC_COMPULSORY_TIME;
	category: ConstraintCategory.TIME;
};

export type StudentsSetNotAvailableTimesConstraint =
	Constraint<StudentsSetNotAvailableTimesParams> & {
		type: ConstraintType.STUDENTS_SET_NOT_AVAILABLE_TIMES;
		category: ConstraintCategory.TIME;
	};

export type MinDaysBetweenActivitiesConstraint = Constraint<MinDaysBetweenActivitiesParams> & {
	type: ConstraintType.MIN_DAYS_BETWEEN_ACTIVITIES;
	category: ConstraintCategory.TIME;
};

export type ActivitiesPreferredStartingTimesConstraint =
	Constraint<ActivitiesPreferredStartingTimesParams> & {
		type: ConstraintType.ACTIVITIES_PREFERRED_STARTING_TIMES;
		category: ConstraintCategory.TIME;
	};

export type TeacherNotAvailableTimesConstraint = Constraint<TeacherNotAvailableTimesParams> & {
	type: ConstraintType.TEACHER_NOT_AVAILABLE_TIMES;
	category: ConstraintCategory.TIME;
};

export type TeacherMaxGapsPerDayConstraint = Constraint<TeacherMaxGapsPerDayParams> & {
	type: ConstraintType.TEACHER_MAX_GAPS_PER_DAY;
	category: ConstraintCategory.TIME;
};

export type BreakTimesConstraint = Constraint<BreakTimesParams> & {
	type: ConstraintType.BREAK_TIMES;
	category: ConstraintCategory.TIME;
};

export type TeacherMaxHoursDailyConstraint = Constraint<TeacherMaxHoursDailyParams> & {
	type: ConstraintType.TEACHER_MAX_HOURS_DAILY;
	category: ConstraintCategory.TIME;
};

export type ActivityPreferredTimeSlotsConstraint = Constraint<ActivityPreferredTimeSlotsParams> & {
	type: ConstraintType.ACTIVITY_PREFERRED_TIME_SLOTS;
	category: ConstraintCategory.TIME;
};

export type ActivitiesSameStartingTimeConstraint = Constraint<ActivitiesSameStartingTimeParams> & {
	type: ConstraintType.ACTIVITIES_SAME_STARTING_TIME;
	category: ConstraintCategory.TIME;
};

export type ActivitiesNotOverlappingConstraint = Constraint<ActivitiesNotOverlappingParams> & {
	type: ConstraintType.ACTIVITIES_NOT_OVERLAPPING;
	category: ConstraintCategory.TIME;
};

export type ActivitiesOccupyMaxDifferentRoomsConstraint =
	Constraint<ActivitiesOccupyMaxDifferentRoomsParams> & {
		type: ConstraintType.ACTIVITIES_OCCUPY_MAX_DIFFERENT_ROOMS;
		category: ConstraintCategory.TIME;
	};

export type ActivitiesPreferredTimeSlotsConstraint =
	Constraint<ActivitiesPreferredTimeSlotsParams> & {
		type: ConstraintType.ACTIVITIES_PREFERRED_TIME_SLOTS;
		category: ConstraintCategory.TIME;
	};

export type ActivitiesSameRoomIfConsecutiveConstraint =
	Constraint<ActivitiesSameRoomIfConsecutiveParams> & {
		type: ConstraintType.ACTIVITIES_SAME_ROOM_IF_CONSECUTIVE;
		category: ConstraintCategory.TIME;
	};

export type MinGapsBetweenActivitiesConstraint = Constraint<MinGapsBetweenActivitiesParams> & {
	type: ConstraintType.MIN_GAPS_BETWEEN_ACTIVITIES;
	category: ConstraintCategory.TIME;
};

export type TwoActivitiesConsecutiveConstraint = Constraint<TwoActivitiesConsecutiveParams> & {
	type: ConstraintType.TWO_ACTIVITIES_CONSECUTIVE;
	category: ConstraintCategory.TIME;
};

// Space Constraint Types
export type BasicCompulsorySpaceConstraint = Constraint<BasicCompulsorySpaceParams> & {
	type: ConstraintType.BASIC_COMPULSORY_SPACE;
	category: ConstraintCategory.SPACE;
};

export type TeacherHomeRoomConstraint = Constraint<TeacherHomeRoomParams> & {
	type: ConstraintType.TEACHER_HOME_ROOM;
	category: ConstraintCategory.SPACE;
};

export type ActivityPreferredRoomConstraint = Constraint<ActivityPreferredRoomParams> & {
	type: ConstraintType.ACTIVITY_PREFERRED_ROOM;
	category: ConstraintCategory.SPACE;
};

export type ActivityPreferredRoomsConstraint = Constraint<ActivityPreferredRoomsParams> & {
	type: ConstraintType.ACTIVITY_PREFERRED_ROOMS;
	category: ConstraintCategory.SPACE;
};

export type StudentsSetHomeRoomConstraint = Constraint<StudentsSetHomeRoomParams> & {
	type: ConstraintType.STUDENTS_SET_HOME_ROOM;
	category: ConstraintCategory.SPACE;
};

export type SubjectActivityTagPreferredRoomConstraint =
	Constraint<SubjectActivityTagPreferredRoomParams> & {
		type: ConstraintType.SUBJECT_ACTIVITY_TAG_PREFERRED_ROOM;
		category: ConstraintCategory.SPACE;
	};

export type SubjectPreferredRoomsConstraint = Constraint<SubjectPreferredRoomsParams> & {
	type: ConstraintType.SUBJECT_PREFERRED_ROOMS;
	category: ConstraintCategory.SPACE;
};

// Union type for all constraints
export type TimetableConstraint =
	// Time Constraints
	| BasicCompulsoryTimeConstraint
	| StudentsSetNotAvailableTimesConstraint
	| MinDaysBetweenActivitiesConstraint
	| ActivitiesPreferredStartingTimesConstraint
	| TeacherNotAvailableTimesConstraint
	| TeacherMaxGapsPerDayConstraint
	| BreakTimesConstraint
	| TeacherMaxHoursDailyConstraint
	| ActivityPreferredTimeSlotsConstraint
	| ActivitiesSameStartingTimeConstraint
	| ActivitiesNotOverlappingConstraint
	| ActivitiesOccupyMaxDifferentRoomsConstraint
	| ActivitiesPreferredTimeSlotsConstraint
	| ActivitiesSameRoomIfConsecutiveConstraint
	| MinGapsBetweenActivitiesConstraint
	| TwoActivitiesConsecutiveConstraint
	// Space Constraints
	| BasicCompulsorySpaceConstraint
	| TeacherHomeRoomConstraint
	| ActivityPreferredRoomConstraint
	| ActivityPreferredRoomsConstraint
	| StudentsSetHomeRoomConstraint
	| SubjectActivityTagPreferredRoomConstraint
	| SubjectPreferredRoomsConstraint;

// Factory functions for creating constraints

// Time Constraint Factories
export const createTeacherMaxHoursDailyConstraint = (
	id: string,
	params: TeacherMaxHoursDailyParams,
	weight: number = 100,
	active: boolean = true,
	description?: string
): TeacherMaxHoursDailyConstraint => ({
	id,
	type: ConstraintType.TEACHER_MAX_HOURS_DAILY,
	category: ConstraintCategory.TIME,
	weight,
	active,
	description,
	parameters: params
});

export const createActivitiesOccupyMaxDifferentRoomsConstraint = (
	id: string,
	params: ActivitiesOccupyMaxDifferentRoomsParams,
	weight: number = 100,
	active: boolean = true,
	description?: string
): ActivitiesOccupyMaxDifferentRoomsConstraint => ({
	id,
	type: ConstraintType.ACTIVITIES_OCCUPY_MAX_DIFFERENT_ROOMS,
	category: ConstraintCategory.TIME,
	weight,
	active,
	description,
	parameters: params
});

export const createStudentsSetNotAvailableTimesConstraint = (
	id: string,
	params: StudentsSetNotAvailableTimesParams,
	weight: number = 100,
	active: boolean = true,
	description?: string
): StudentsSetNotAvailableTimesConstraint => ({
	id,
	type: ConstraintType.STUDENTS_SET_NOT_AVAILABLE_TIMES,
	category: ConstraintCategory.TIME,
	weight,
	active,
	description,
	parameters: params
});

export const createTeacherNotAvailableTimesConstraint = (
	id: string,
	params: TeacherNotAvailableTimesParams,
	weight: number = 100,
	active: boolean = true,
	description?: string
): TeacherNotAvailableTimesConstraint => ({
	id,
	type: ConstraintType.TEACHER_NOT_AVAILABLE_TIMES,
	category: ConstraintCategory.TIME,
	weight,
	active,
	description,
	parameters: params
});

export const createActivityPreferredRoomConstraint = (
	id: string,
	params: ActivityPreferredRoomParams,
	weight: number = 100,
	active: boolean = true,
	description?: string
): ActivityPreferredRoomConstraint => ({
	id,
	type: ConstraintType.ACTIVITY_PREFERRED_ROOM,
	category: ConstraintCategory.SPACE,
	weight,
	active,
	description,
	parameters: params
});

export const createMinDaysBetweenActivitiesConstraint = (
	id: string,
	params: MinDaysBetweenActivitiesParams,
	weight: number = 100,
	active: boolean = true,
	description?: string
): MinDaysBetweenActivitiesConstraint => ({
	id,
	type: ConstraintType.MIN_DAYS_BETWEEN_ACTIVITIES,
	category: ConstraintCategory.TIME,
	weight,
	active,
	description,
	parameters: params
});

export const createBreakTimesConstraint = (
	id: string,
	params: BreakTimesParams,
	weight: number = 100,
	active: boolean = true,
	description?: string
): BreakTimesConstraint => ({
	id,
	type: ConstraintType.BREAK_TIMES,
	category: ConstraintCategory.TIME,
	weight,
	active,
	description,
	parameters: params
});

export const createTeacherMaxGapsPerDayConstraint = (
	id: string,
	params: TeacherMaxGapsPerDayParams,
	weight: number = 100,
	active: boolean = true,
	description?: string
): TeacherMaxGapsPerDayConstraint => ({
	id,
	type: ConstraintType.TEACHER_MAX_GAPS_PER_DAY,
	category: ConstraintCategory.TIME,
	weight,
	active,
	description,
	parameters: params
});

// Helper type guards for type-safe access
export const isTimeConstraint = (constraint: TimetableConstraint): boolean =>
	constraint.category === ConstraintCategory.TIME;

export const isSpaceConstraint = (constraint: TimetableConstraint): boolean =>
	constraint.category === ConstraintCategory.SPACE;

export const isTeacherMaxHoursDailyConstraint = (
	constraint: TimetableConstraint
): constraint is TeacherMaxHoursDailyConstraint =>
	constraint.type === ConstraintType.TEACHER_MAX_HOURS_DAILY;

export const isActivitiesOccupyMaxDifferentRoomsConstraint = (
	constraint: TimetableConstraint
): constraint is ActivitiesOccupyMaxDifferentRoomsConstraint =>
	constraint.type === ConstraintType.ACTIVITIES_OCCUPY_MAX_DIFFERENT_ROOMS;

export const isStudentsSetNotAvailableTimesConstraint = (
	constraint: TimetableConstraint
): constraint is StudentsSetNotAvailableTimesConstraint =>
	constraint.type === ConstraintType.STUDENTS_SET_NOT_AVAILABLE_TIMES;

export const isTeacherNotAvailableTimesConstraint = (
	constraint: TimetableConstraint
): constraint is TeacherNotAvailableTimesConstraint =>
	constraint.type === ConstraintType.TEACHER_NOT_AVAILABLE_TIMES;

// Utility functions
export const getConstraintsByCategory = (
	constraints: TimetableConstraint[],
	category: ConstraintCategory
): TimetableConstraint[] => constraints.filter((constraint) => constraint.category === category);

export const getConstraintsByType = (
	constraints: TimetableConstraint[],
	type: ConstraintType
): TimetableConstraint[] => constraints.filter((constraint) => constraint.type === type);

export const getActiveConstraints = (constraints: TimetableConstraint[]): TimetableConstraint[] =>
	constraints.filter((constraint) => constraint.active);

export const getMandatoryConstraints = (
	constraints: TimetableConstraint[]
): TimetableConstraint[] => constraints.filter((constraint) => constraint.weight === 100);

export const getConstraintById = (
	constraints: TimetableConstraint[],
	id: string
): TimetableConstraint | undefined => constraints.find((constraint) => constraint.id === id);
