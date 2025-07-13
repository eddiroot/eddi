import {
	pgTable,
	text,
	integer,
	time,
	type AnyPgColumn,
	foreignKey,
	interval,
	boolean,
	pgEnum,
	unique,
	check
} from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { campus, school, schoolLocation } from './schools';
import { user } from './user';
import { sql } from 'drizzle-orm/sql';
import { courseMapItem } from './coursemap';
import { curriculumSubject, yearLevelEnumPg } from './curriculum';
import { task } from './task';

export const coreSubject = pgTable('core_subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	description: text('description'),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type CoreSubject = typeof coreSubject.$inferSelect;

export const electiveSubject = pgTable('elective_subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	description: text('description'),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export const subject = pgTable(
	'subject',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		name: text('name').notNull(),
		schoolId: integer('school_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		coreSubjectId: integer('core_sub_id').references(() => coreSubject.id, {
			onDelete: 'set null'
		}),
		electiveSubjectId: integer('elective_sub_id').references(() => electiveSubject.id, {
			onDelete: 'set null'
		}),
		yearLevel: yearLevelEnumPg().notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(subject) => [
		unique().on(subject.schoolId, subject.name),
		check(
			'either_core_or_elective',
			sql`(core_sub_id IS NOT NULL AND elective_sub_id IS NULL) OR (core_sub_id IS NULL AND elective_sub_id IS NOT NULL)`
		)
	]
);

export type Subject = typeof subject.$inferSelect;

export const subjectOffering = pgTable('sub_offering', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectId: integer('sub_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	year: integer('year').notNull(),
	semester: integer('semester').notNull(),
	campusId: integer('campus_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectOffering = typeof subjectOffering.$inferSelect;

export enum userSubjectOfferingRoleEnum {
	student = 'student',
	teacher = 'teacher',
	moderator = 'moderator'
}

export const userSubjectOfferingRoleEnumPg = pgEnum('user_sub_offering_role', [
	userSubjectOfferingRoleEnum.student,
	userSubjectOfferingRoleEnum.teacher,
	userSubjectOfferingRoleEnum.moderator
]);

export const userSubjectOffering = pgTable('user_sub_offering', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subOfferingId: integer('sub_offering_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	role: userSubjectOfferingRoleEnumPg().notNull(),
	isComplete: integer('is_complete').default(0).notNull(),
	isArchived: integer('is_archived').default(0).notNull(),
	color: integer('color').default(100).notNull(),
	...timestamps
});

export type UserSubjectOffering = typeof userSubjectOffering.$inferSelect;

export const subjectOfferingClass = pgTable(
	'sub_offering_class',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		name: text('name').notNull(),
		subOfferingId: integer('sub_offering_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.subOfferingId, self.name)]
);

export type SubjectOfferingClass = typeof subjectOfferingClass.$inferSelect;

export enum userSubjectOfferingClassRoleEnum {
	student = 'student',
	teacher = 'teacher'
}

export const userSubjectOfferingClassRoleEnumPg = pgEnum('user_sub_off_class_role', [
	userSubjectOfferingClassRoleEnum.student,
	userSubjectOfferingClassRoleEnum.teacher
]);

export const userSubjectOfferingClass = pgTable('user_sub_off_class', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subOffClassId: integer('sub_off_class_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	role: userSubjectOfferingClassRoleEnumPg().notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type UserSubjectOfferingClass = typeof userSubjectOfferingClass.$inferSelect;

export enum dayOfWeekEnum {
	monday = 'monday',
	tuesday = 'tuesday',
	wednesday = 'wednesday',
	thursday = 'thursday',
	friday = 'friday',
	saturday = 'saturday',
	sunday = 'sunday'
}

export const dayOfWeekEnumPg = pgEnum('day_of_week', [
	dayOfWeekEnum.monday,
	dayOfWeekEnum.tuesday,
	dayOfWeekEnum.wednesday,
	dayOfWeekEnum.thursday,
	dayOfWeekEnum.friday,
	dayOfWeekEnum.saturday,
	dayOfWeekEnum.sunday
]);

export const subjectClassAllocation = pgTable('sub_class_allo', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingClassId: integer('sub_off_class_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	schoolLocationId: integer('sch_loc_id')
		.notNull()
		.references(() => schoolLocation.id, { onDelete: 'set null' }),
	dayOfWeek: dayOfWeekEnumPg().notNull(),
	startTime: time('start_time').notNull(),
	duration: interval('duration').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectClassAllocation = typeof subjectClassAllocation.$inferSelect;

export enum subjectThreadTypeEnum {
	discussion = 'discussion',
	question = 'question',
	announcement = 'announcement',
	qanda = 'qanda'
}

export const subjectThreadTypeEnumPg = pgEnum('subject_thread_type', [
	subjectThreadTypeEnum.discussion,
	subjectThreadTypeEnum.question,
	subjectThreadTypeEnum.announcement,
	subjectThreadTypeEnum.qanda
]);

export const subjectThread = pgTable('sub_thread', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	type: subjectThreadTypeEnumPg().notNull(),
	subjectOfferingId: integer('sub_offering_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	content: text('content').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectThread = typeof subjectThread.$inferSelect;

export enum subjectThreadResponseTypeEnum {
	comment = 'comment',
	answer = 'answer'
}

export const subjectThreadResponseTypeEnumPg = pgEnum('subject_thread_response_type', [
	subjectThreadResponseTypeEnum.comment,
	subjectThreadResponseTypeEnum.answer
]);

export const subjectThreadResponse = pgTable(
	'sub_thread_response',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		type: subjectThreadResponseTypeEnumPg().notNull(),
		subjectThreadId: integer('sub_thread_id')
			.notNull()
			.references(() => subjectThread.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		parentResponseId: integer('parent_id').references((): AnyPgColumn => subjectThreadResponse.id),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.parentResponseId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

export type SubjectThreadResponse = typeof subjectThreadResponse.$inferSelect;

export const subjectOfferingClassTask = pgTable('sub_off_class_task', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	index: integer('index').notNull(),
	subjectOfferingClassId: integer('sub_off_class_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	authorId: text('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	courseMapItemId: integer('cm_item_id').references(() => courseMapItem.id, {
		onDelete: 'cascade'
	}),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectOfferingClassTask = typeof subjectOfferingClassTask.$inferSelect;

export const subjectOfferingClassResource = pgTable('sub_off_class_resource', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingClassId: integer('sub_off_class_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	coursemapItemId: integer('cm_item_id').references(() => courseMapItem.id, {
		onDelete: 'cascade'
	}),
	authorId: text('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectOfferingClassResource = typeof subjectOfferingClassResource.$inferSelect;
