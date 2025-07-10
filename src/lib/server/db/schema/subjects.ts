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
import { task } from './task';
import { user } from './user';
import { sql } from 'drizzle-orm/sql';

export const curriculum = pgTable('curriculum', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	version: text('version').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Curriculum = typeof curriculum.$inferSelect;

export const curriculumSubject = pgTable('curriculum_subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	curriculumId: integer('cur_id')
		.notNull()
		.references(() => curriculum.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type CurriculumSubject = typeof curriculumSubject.$inferSelect;

export const learningArea = pgTable('learning_area', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type LearningArea = typeof learningArea.$inferSelect;

export enum yearLevelEnum {
	foundation = 'F',
	year1 = '1',
	year2 = '2',
	year3 = '3',
	year4 = '4',
	year5 = '5',
	year6 = '6',
	year7 = '7',
	year8 = '8',
	year9 = '9',
	year10 = '10',
	year10A = '10A'
}

export const yearLevelEnumPg = pgEnum('year_level', [
	yearLevelEnum.foundation,
	yearLevelEnum.year1,
	yearLevelEnum.year2,
	yearLevelEnum.year3,
	yearLevelEnum.year4,
	yearLevelEnum.year5,
	yearLevelEnum.year6,
	yearLevelEnum.year7,
	yearLevelEnum.year8,
	yearLevelEnum.year9,
	yearLevelEnum.year10,
	yearLevelEnum.year10A
]);

export const learningAreaContent = pgTable('learning_area_content', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaId: integer('learn_a_id')
		.notNull()
		.references(() => learningArea.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	yearLevel: yearLevelEnumPg().notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type LearningAreaContent = typeof learningAreaContent.$inferSelect;

export const contentElaboration = pgTable('content_elaboration', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaContentId: integer('learn_a_con_id')
		.notNull()
		.references(() => learningAreaContent.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	contentElaboration: text('cont_elab').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type ContentElaboration = typeof contentElaboration.$inferSelect;

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

export const courseMapItem = pgTable(
	'course_map_item',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		topic: text('topic').notNull(),
		description: text('description'),
		startWeek: integer('start_week').notNull(),
		duration: integer('duration').notNull(),
		semester: integer('semester').notNull(),
		originalId: integer('original_id'),
		previousId: integer('previous_id'),
		version: integer('version').notNull().default(1),
		isCurrentVersion: boolean('is_current_version').notNull().default(true),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		foreignKey({
			columns: [self.previousId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

export type CourseMapItem = typeof courseMapItem.$inferSelect;

export const courseMapItemAreaOfSudty = pgTable(
	'course_map_item_area_of_study',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_item_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		learningAreaId: integer('learn_a_id')
			.notNull()
			.references(() => learningArea.id, { onDelete: 'cascade' }),
		originalId: integer('original_id'),
		previousId: integer('previous_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		foreignKey({
			columns: [self.previousId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

export type CoursemapItemAreaOfStudy = typeof courseMapItemAreaOfSudty.$inferSelect;

// if we want to check across the area of study contents,
export const courseMapItemAssessmentPlan = pgTable(
	'cm_item_as_plan',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_item_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		originalId: integer('original_id'),
		previousId: integer('previous_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		foreignKey({
			columns: [self.previousId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

export type CourseMapItemAssessmentPlan = typeof courseMapItemAssessmentPlan.$inferSelect;

export const courseMapItemLessonPlan = pgTable(
	'cm_item_lesson_plan',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_item_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		originalId: integer('original_id'),
		previousId: integer('previous_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		foreignKey({
			columns: [self.previousId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

export type CourseMapItemLessonPlan = typeof courseMapItemLessonPlan.$inferSelect;

export const courseMapItemResource = pgTable(
	'course_map_item_resource',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_item_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		resourceId: integer('resource_id').notNull(),
		originalId: integer('original_id'),
		previousId: integer('previous_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		foreignKey({
			columns: [self.previousId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

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

export const subjectOfferingClass = pgTable('sub_offering_class', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subOfferingId: integer('sub_offering_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

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

export const subjectOfferingTask = pgTable(
	'sub_off_task',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_item_id').references(() => courseMapItem.id, {
			onDelete: 'cascade'
		}),
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		taskId: integer('task_id')
			.notNull()
			.references(() => task.id, { onDelete: 'cascade' }),
		createdUserId: text('assignee_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		originalId: integer('original_id'),
		previousId: integer('previous_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		foreignKey({
			columns: [self.previousId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

export type SubjectOfferingTask = typeof subjectOfferingTask.$inferSelect;

export const subjectOfferingResource = pgTable(
	'sub_off_resource',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		coursemapItemId: integer('cm_item_id').references(() => courseMapItem.id, {
			onDelete: 'cascade'
		}),
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		createdUserId: text('assignee_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		resourceId: integer('resource_id').notNull(),
		originalId: integer('original_id'),
		previousId: integer('previous_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		foreignKey({
			columns: [self.previousId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

export type SubjectOfferingResource = typeof subjectOfferingResource.$inferSelect;

export const subjectOfferingClassTask = pgTable('sub_off_class_task', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingClassId: integer('sub_off_class_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectOfferingClassTask = typeof subjectOfferingClassTask.$inferSelect;

export const subjectOfferingClassResource = pgTable('sub_off_class_resource', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingClassId: integer('sub_off_class_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectOfferingClassResource = typeof subjectOfferingClassResource.$inferSelect;

export const subjectOfferingTaskSubjectOfferingClassTask = pgTable(
	'sub_off_task_sub_off_class_task',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		index: integer('index').notNull(),
		subjectOfferingTaskId: integer('sub_off_task_id')
			.notNull()
			.references(() => subjectOfferingTask.id, { onDelete: 'cascade' }),
		subjectOfferingClassTaskId: integer('sub_off_class_task_id')
			.notNull()
			.references(() => subjectOfferingClassTask.id, { onDelete: 'cascade' }),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	}
);

export type SubjectOfferingTaskSubjectOfferingClassTask =
	typeof subjectOfferingTaskSubjectOfferingClassTask.$inferSelect;

export const subjectOfferingResourceSubjectOfferingClassResource = pgTable(
	'sub_off_res_sub_off_class_res',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		subjectOfferingResourceId: integer('sub_off_res_id')
			.notNull()
			.references(() => subjectOfferingResource.id, { onDelete: 'cascade' }),
		subjectOfferingClassResourceId: integer('sub_off_class_res_id')
			.notNull()
			.references(() => subjectOfferingClassResource.id, { onDelete: 'cascade' }),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	}
);

export type SubjectOfferingResourceSubjectOfferingClassResource =
	typeof subjectOfferingResourceSubjectOfferingClassResource.$inferSelect;
