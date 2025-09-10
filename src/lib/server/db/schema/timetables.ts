import {
	pgTable,
	text,
	integer,
	boolean,
	unique,
	uuid,
	time,
	pgEnum,
	jsonb
} from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { user } from './user';
import { yearLevelEnumPg } from './curriculum';
import { subject } from './subjects';
import { school } from './schools';
import { constraintTypeEnum, queueStatusEnum } from '../../../enums';

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

export const timetableQueueStatusEnumPg = pgEnum('enum_tt_queue_status', [
	queueStatusEnum.queued,
	queueStatusEnum.inProgress,
	queueStatusEnum.completed,
	queueStatusEnum.failed
]);

export const timetableQueue = pgTable('tt_queue', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	fileName: text('file_name').notNull(),
	status: timetableQueueStatusEnumPg().notNull().default(queueStatusEnum.queued),
	...timestamps
});

export type TimetableQueue = typeof timetableQueue.$inferSelect;

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

export const fetActivity = pgTable('fet_activity', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	teacherId: text('teacher_id').notNull(),
	subjectId: integer('subject_id').notNull(),
	groupId: integer('tt_group_id').notNull(),
	spaceId: integer('space_id').notNull(),
	day: integer('tt_day_id').notNull(),
	period: integer('tt_period_id').notNull(),
	duration: integer('duration').notNull()
});

export type FETDBActivity = typeof fetActivity.$inferSelect;

export const timetableConstraint = pgTable('tt_constraint', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	constraintId: text('constraint_id').notNull(), // unique identifier for the constraint
	...timestamps
});

export type TimetableConstraint = typeof timetableConstraint.$inferSelect;

export const constraintTypeEnumPg = pgEnum('enum_constraint_type', [
	constraintTypeEnum.time,
	constraintTypeEnum.space
]);

export const constraint = pgTable('constraint', {
	id: text('id').primaryKey(), // unique identifier for the constraint
	name: text('name').notNull(),
	description: text('description').notNull(),
	type: constraintTypeEnumPg().notNull(), // e.g., 'time', 'space'
	active: boolean('active').notNull().default(true),
	// JSON schema to define the structure of parameters for this constraint
	parameterSchema: jsonb('parameter_schema').notNull(),
	// Example parameters to help users understand how to configure this constraint
	exampleParameters: jsonb('example_parameters').notNull(),
	...timestamps
});

export type Constraint = typeof constraint.$inferSelect;
