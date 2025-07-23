import { pgTable, text, integer, boolean, pgEnum, unique, uuid, time } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { user } from './user';
import { yearLevelEnumPg } from './curriculum';
import { schoolSpaceTypeEnum } from '../../../enums';
import { subject } from './subjects';

export const school = pgTable('school', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull().unique(),
	logoUrl: text('logo_url'),
	...timestamps
});

export type School = typeof school.$inferSelect;

export const campus = pgTable('campus', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	address: text('address').notNull(),
	description: text('description'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Campus = typeof campus.$inferSelect;

export const userCampus = pgTable('user_campus', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	campusId: integer('campus_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	...timestamps
});

export type UserCampus = typeof userCampus.$inferSelect;

export const schoolBuilding = pgTable(
	'school_building',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		campusId: integer('campus_id')
			.notNull()
			.references(() => campus.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.campusId, self.name)]
);

export type SchoolBuilding = typeof schoolBuilding.$inferSelect;

export const schoolSpaceTypeEnumPg = pgEnum('school_location_type', [
	schoolSpaceTypeEnum.classroom,
	schoolSpaceTypeEnum.laboratory,
	schoolSpaceTypeEnum.gymnasium,
	schoolSpaceTypeEnum.pool,
	schoolSpaceTypeEnum.library,
	schoolSpaceTypeEnum.auditorium
]);

export const schoolSpace = pgTable(
	'school_space',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		buildingId: integer('building_id')
			.notNull()
			.references(() => schoolBuilding.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		type: schoolSpaceTypeEnumPg().notNull(),
		capacity: integer('capacity'),
		description: text('description'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.buildingId, self.name)]
);

export type SchoolSpace = typeof schoolSpace.$inferSelect;

export const timetable = pgTable(
	'tt',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		schoolYear: integer('sch_year').notNull(),
		name: text('name').notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.schoolId, self.name)]
);

export type Timetable = typeof timetable.$inferSelect;

export const timetableDay = pgTable('tt_day', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	day: integer('day').notNull(), // numbers align with $lib/utils
	...timestamps
});

export type TimetableDay = typeof timetableDay.$inferSelect;

export const timetablePeriod = pgTable('tt_period', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	startTime: time('start_time').notNull(),
	endTime: time('end_time').notNull(),
	...timestamps
});

export type TimetablePeriod = typeof timetablePeriod.$inferSelect;

export const timetableGroup = pgTable('tt_group', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	yearLevel: yearLevelEnumPg().notNull(),
	name: text('name').notNull(),
	...timestamps
});

export type TimetableGroup = typeof timetableGroup.$inferSelect;

export const timetableGroupMember = pgTable(
	'tt_group_member',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		groupId: integer('tt_group_id')
			.notNull()
			.references(() => timetableGroup.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(self) => [unique().on(self.groupId, self.userId)]
);

export type TimetableGroupMember = typeof timetableGroupMember.$inferSelect;

export const timetableActivity = pgTable('tt_activity', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	subjectId: integer('subject_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	teacherId: uuid('teacher_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	groupId: integer('tt_group_id')
		.notNull()
		.references(() => timetableGroup.id, { onDelete: 'cascade' }),
	periodsPerInstance: integer('periods_per_instance').notNull().default(1),
	totalPeriods: integer('total_periods').notNull(),
	...timestamps
});

export type TimetableActivity = typeof timetableActivity.$inferSelect;
