import {
	boolean,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	time,
	unique,
	uuid
} from 'drizzle-orm/pg-core';
import { constraintTypeEnum, queueStatusEnum } from '../../../enums';
import { yearLevelEnumPg } from './curriculum';
import { school, schoolSpace } from './schools';
import { subject } from './subjects';
import { user } from './user';
import { timestamps } from './utils';

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

export const timetableIteration = pgTable('tt_iteration', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	...timestamps
});

export type TimetableIteration = typeof timetableIteration.$inferSelect;

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
	iterationId: integer('tt_iteration_id')
		.notNull()
		.references(() => timetableIteration.id, { onDelete: 'cascade' }),
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
	periodsPerInstance: integer('periods_per_instance').notNull().default(1),
	totalPeriods: integer('total_periods').notNull(),
	...timestamps
});

export type TimetableActivity = typeof timetableActivity.$inferSelect;

export const timetableActivityTeacherPreference = pgTable(
	'tt_activity_teacher_pref',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		teacherId: uuid('teacher_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_teacher_pref_pkey',
				columns: [table.timetableActivityId, table.teacherId]
			})
		};
	}
);

export type TimetableActivityTeacherPreferences =
	typeof timetableActivityTeacherPreference.$inferSelect;

export const timetableActivityPreferredSpace = pgTable(
	'tt_activity_preferred_space',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		schoolSpaceId: integer('sch_space_id')
			.references(() => schoolSpace.id, { onDelete: 'cascade' })
			.notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_preferred_space_pkey',
				columns: [table.timetableActivityId, table.schoolSpaceId]
			})
		};
	}
);

export type TimetableActivityPreferredSpaces = typeof timetableActivityPreferredSpace.$inferSelect;

export const timetableActivityAssignedStudent = pgTable(
	'tt_activity_assign_stu',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		userId: uuid('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_assign_stu_pkey',
				columns: [table.timetableActivityId, table.userId]
			})
		};
	}
);

export type TimetableActivityAssignedStudents =
	typeof timetableActivityAssignedStudent.$inferSelect;

export const timetableActivityAssignedGroup = pgTable(
	'tt_activity_assign_grp',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		ttGroupId: integer('tt_group_id')
			.references(() => timetableGroup.id, { onDelete: 'cascade' })
			.notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_assign_grp_pkey',
				columns: [table.timetableActivityId, table.ttGroupId]
			})
		};
	}
);

export type TimetableActivityAssignedGroup = typeof timetableActivityAssignedGroup.$inferSelect;

export const timetableActivityAssignedYear = pgTable(
	'tt_activity_assign_yr',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		yearlevel: yearLevelEnumPg().notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_assign_yr_pkey',
				columns: [table.timetableActivityId, table.yearlevel]
			})
		};
	}
);

export type TimetableActivityAssignedYear = typeof timetableActivityAssignedYear.$inferSelect;

export const fetActivity = pgTable('fet_activity', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	teacherId: uuid('teacher_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subjectId: integer('subject_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	spaceId: integer('space_id').notNull(),
	day: integer('tt_day_id').notNull(),
	period: integer('tt_period_id').notNull(),
	duration: integer('duration').notNull()
});

export type FETDBActivity = typeof fetActivity.$inferSelect;

export const userFetActivity = pgTable(
	'fet_activity_user',
	{
		fetActivityId: integer('tt_activity_id')
			.notNull()
			.references(() => fetActivity.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'user_feet_activity_pkey',
				columns: [table.fetActivityId, table.userId]
			})
		};
	}
);

export type UserFETActivity = typeof userFetActivity.$inferSelect;

export const timetableConstraint = pgTable('tt_constraint', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	constraintId: integer('constraint_id')
		.notNull() // unique identifier for the constraint
		.references(() => constraint.id, { onDelete: 'cascade' }),
	active: boolean('active').notNull().default(true),
	// JSON schema to define the structure of parameters for this constraint
	parameters: jsonb('parameters').notNull(),
	...timestamps
});

export type TimetableConstraint = typeof timetableConstraint.$inferSelect;

export const constraintTypeEnumPg = pgEnum('enum_constraint_type', [
	constraintTypeEnum.time,
	constraintTypeEnum.space
]);

export const constraint = pgTable('constraint', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }), // unique identifier for the constraint
	FETName: text('name').notNull(),
	friendlyName: text('friendly_name').notNull(),
	description: text('description').notNull(),
	type: constraintTypeEnumPg().notNull(), // e.g., 'time', 'space'
	optional: boolean('optional').notNull(), // whether this constraint is optional or mandatory
	repeatable: boolean('repeatable').notNull(), // whether this constraint can be added multiple times
	...timestamps
});

export type Constraint = typeof constraint.$inferSelect;
