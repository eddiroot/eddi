import {
	pgTable,
	text,
	integer,
	boolean,
	jsonb,
	pgEnum,
	foreignKey,
	unique,
	uuid,
	timestamp
} from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { subjectOffering, subjectOfferingClass } from './subjects';
import { user } from './user';
import { courseMapItem } from './coursemap';
import { doublePrecision } from 'drizzle-orm/pg-core';
import { learningAreaStandard } from './curriculum';
import { resource } from './resource';
import {
	taskBlockResponseStatusEnum,
	taskBlockTypeEnum,
	taskStatusEnum,
	taskTypeEnum,
	whiteboardObjectTypeEnum
} from '../../../enums';

export const taskTypeEnumPg = pgEnum('enum_task_type', [
	taskTypeEnum.lesson,
	taskTypeEnum.assessment,
	taskTypeEnum.homework
]);

export const task = pgTable(
	'task',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		title: text('title').notNull(),
		type: taskTypeEnumPg().notNull(),
		description: text('description').notNull(),
		rubricId: integer('rubric_id').references(() => rubric.id, { onDelete: 'set null' }),
		originalId: integer('original_id'),
		version: integer('version').notNull().default(1),
		subjectOfferingId: integer('subject_offering_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		aiTutorEnabled: boolean('ai_tutor_enabled').notNull().default(true),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		unique().on(self.originalId, self.version)
	]
);

export type Task = typeof task.$inferSelect;

export const taskBlockTypeEnumPg = pgEnum('enum_task_block_type', [
	taskBlockTypeEnum.h1,
	taskBlockTypeEnum.h2,
	taskBlockTypeEnum.h3,
	taskBlockTypeEnum.h4,
	taskBlockTypeEnum.h5,
	taskBlockTypeEnum.h6,
	taskBlockTypeEnum.markdown,
	taskBlockTypeEnum.image,
	taskBlockTypeEnum.video,
	taskBlockTypeEnum.audio,
	taskBlockTypeEnum.fillInBlank,
	taskBlockTypeEnum.multipleChoice,
	taskBlockTypeEnum.whiteboard,
	taskBlockTypeEnum.matching,
	taskBlockTypeEnum.twoColumnLayout,
	taskBlockTypeEnum.shortAnswer
]);

export const taskBlock = pgTable('task_block', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	type: taskBlockTypeEnumPg().notNull(),
	content: jsonb('content').notNull(),
	index: integer('index').notNull().default(0),
	availableMarks: integer('available_marks'),
	...timestamps
});

export type TaskBlock = typeof taskBlock.$inferSelect;

export const taskStatusEnumPg = pgEnum('enum_task_status', [
	taskStatusEnum.draft,
	taskStatusEnum.inProgress,
	taskStatusEnum.published,
	taskStatusEnum.completed,
	taskStatusEnum.locked,
	taskStatusEnum.released
]);

export const subjectOfferingClassTask = pgTable('sub_off_class_task', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	index: integer('index').notNull(),
	status: taskStatusEnumPg().notNull().default(taskStatusEnum.draft),
	subjectOfferingClassId: integer('sub_off_class_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	authorId: uuid('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	courseMapItemId: integer('cm_item_id').references(() => courseMapItem.id, {
		onDelete: 'cascade'
	}),
	week: integer('week'),
	dueDate: timestamp({ mode: 'date' }),
	isArchived: boolean('is_archived').notNull().default(false),
	rubricId: integer('rubric_id').references(() => rubric.id, { onDelete: 'set null' }),
	...timestamps
});

export type SubjectOfferingClassTask = typeof subjectOfferingClassTask.$inferSelect;

// potential analysis: This table links tasks to learning area standards, allowing for tracking of which standards are covered by each task.
export const taskStandard = pgTable('task_standard', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	classTaskId: integer('class_task_id')
		.notNull()
		.references(() => subjectOfferingClassTask.id, { onDelete: 'cascade' }),
	learningAreaStandardId: integer('la_standard_id')
		.notNull()
		.references(() => learningAreaStandard.id, { onDelete: 'cascade' })
});

export type TaskStandard = typeof taskStandard.$inferSelect;

export const taskBlockResponse = pgTable('task_block_response', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskBlockId: integer('task_block_id')
		.notNull()
		.references(() => taskBlock.id, { onDelete: 'cascade' }),
	authorId: uuid('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	classTaskId: integer('class_task_id')
		.notNull()
		.references(() => subjectOfferingClassTask.id, { onDelete: 'cascade' }),
	response: jsonb('response'), // This is what the student submits for this task block
	feedback: text('feedback'), // Teacher feedback on the response
	marks: doublePrecision('marks'), // Marks awarded for this task block response (accumulated from answer and criteria responses)
	...timestamps
});

export type TaskBlockResponse = typeof taskBlockResponse.$inferSelect;

export const taskBlockResponseStatusEnumPg = pgEnum('enum_task_block_response_status', [
	taskBlockResponseStatusEnum.editPermission,
	taskBlockResponseStatusEnum.submitted,
	taskBlockResponseStatusEnum.graded
]);

export const classTaskResponse = pgTable('task_response', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	classTaskId: integer('class_task_id')
		.notNull()
		.references(() => subjectOfferingClassTask.id, { onDelete: 'cascade' }),
	authorId: uuid('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }), // Students response to the task
	comment: text('comment'), // Optional comment from the student about their submission
	feedback: text('feedback'), // Teacher feedback on the task response
	marks: doublePrecision('marks').notNull(), // Total marks awarded for the task response
	status: taskBlockResponseStatusEnumPg().notNull().default(taskBlockResponseStatusEnum.submitted),
	teacherId: uuid('teacher_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }), // Teacher who graded the task response
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type ClassTaskResponse = typeof classTaskResponse.$inferSelect;

// Junction table for task response resources (one-to-many relationship)
export const classTaskResponseResource = pgTable('task_response_resource', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	classTaskResponseId: integer('task_response_id')
		.notNull()
		.references(() => classTaskResponse.id, { onDelete: 'cascade' }),
	resourceId: integer('resource_id')
		.notNull()
		.references(() => resource.id, { onDelete: 'cascade' }),
	authorId: uuid('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type ClassTaskResponseResource = typeof classTaskResponseResource.$inferSelect;

export const whiteboard = pgTable('whiteboard', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	title: text('title'),
	...timestamps
});

export type Whiteboard = typeof whiteboard.$inferSelect;

export const whiteboardObjectTypeEnumPg = pgEnum('enum_whiteboard_object_type', [
	whiteboardObjectTypeEnum.rect,
	whiteboardObjectTypeEnum.circle,
	whiteboardObjectTypeEnum.path,
	whiteboardObjectTypeEnum.textbox,
	whiteboardObjectTypeEnum.image
]);

export const whiteboardObject = pgTable('whiteboard_object', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	whiteboardId: integer('whiteboard_id')
		.notNull()
		.references(() => whiteboard.id, { onDelete: 'cascade' }),
	objectId: text('object_id').notNull().unique(),
	objectType: whiteboardObjectTypeEnumPg().notNull(),
	objectData: jsonb('object_data').notNull(),
	...timestamps
});

export type WhiteboardObject = typeof whiteboardObject.$inferSelect;

export const answer = pgTable('answer', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskBlockId: integer('task_block_id')
		.notNull()
		.references(() => taskBlock.id, { onDelete: 'cascade' }),
	answer: jsonb('answer'),
	marks: doublePrecision('marks'),
	...timestamps
});

export type Answer = typeof answer.$inferSelect;

export enum feedbackLevelEnum {
	met = 'met',
	no = 'no',
	partial = 'partial'
}

export const feedbackLevelEnumPg = pgEnum('enum_feedback_level', [
	feedbackLevelEnum.met,
	feedbackLevelEnum.no,
	feedbackLevelEnum.partial
]);

export const answerFeedback = pgTable('ans_feed', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	answerId: integer('ans_id')
		.notNull()
		.references(() => answer.id, { onDelete: 'cascade' }),
	taskBlockResponseId: integer('task_block_response_id')
		.notNull()
		.references(() => taskBlockResponse.id, { onDelete: 'cascade' }),
	marks: doublePrecision('marks').notNull(), // Marks awarded for this answer response
	feedbackLevel: feedbackLevelEnumPg(), // nothing
	...timestamps
});

export type AnswerFeedback = typeof answerFeedback.$inferSelect;

export const criteria = pgTable('criteria', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskBlockId: integer('task_block_id')
		.notNull()
		.references(() => taskBlock.id, { onDelete: 'cascade' }),
	description: text('description').notNull(),
	marks: doublePrecision('marks').notNull(), // Marks assigned to this criteria 1 or 0.5 etc.
	...timestamps
});

export type Criteria = typeof criteria.$inferSelect;

// Record teacher checks for individual criteria on a task-block response
// can award full marks, half marks, or no marks. etc.
export const criteriaFeedback = pgTable('crit_fdbck', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	criteriaId: integer('crit_id')
		.notNull()
		.references(() => criteria.id, { onDelete: 'cascade' }),
	taskBlockResponseId: integer('task_block_response_id')
		.notNull()
		.references(() => taskBlockResponse.id, { onDelete: 'cascade' }),
	feedbackLevel: feedbackLevelEnumPg(), // no | partial | met
	marks: doublePrecision('marks').notNull(), // Marks awarded for this criteria response // can be 1, 0.5, or 0 etc.
	...timestamps
});

export type CriteriaFeedback = typeof criteriaFeedback.$inferSelect;

export const rubric = pgTable('rubric', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	title: text('title').notNull(),
	...timestamps
});

export type Rubric = typeof rubric.$inferSelect;

export const rubricLevelEnum = pgEnum('enum_rubric_level', [
	'exemplary',
	'accomplished',
	'developing',
	'beginning'
]);

export const rubricRow = pgTable('rubric_row', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 2000 }),
	rubricId: integer('rubric_id')
		.notNull()
		.references(() => rubric.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	...timestamps
});

export type RubricRow = typeof rubricRow.$inferSelect;

export const rubricCell = pgTable('rubric_cell', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 3000 }),
	rowId: integer('row_id')
		.notNull()
		.references(() => rubricRow.id, { onDelete: 'cascade' }),
	level: rubricLevelEnum().notNull(),
	description: text('description').notNull(),
	marks: doublePrecision('marks').notNull(),
	...timestamps
});

export type RubricCell = typeof rubricCell.$inferSelect;

// Tracks which rubric cell (performance level) a student achieved for each rubric row
export const rubricCellFeedback = pgTable('rubric_feedback', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 4000 }),
	classTaskResponseId: integer('class_task_response_id')
		.notNull()
		.references(() => classTaskResponse.id, { onDelete: 'cascade' }),
	rubricRowId: integer('rubric_row_id')
		.notNull()
		.references(() => rubricRow.id, { onDelete: 'cascade' }),
	rubricCellId: integer('rubric_cell_id')
		.notNull()
		.references(() => rubricCell.id, { onDelete: 'cascade' }),
	feedback: text('feedback'), // Teacher feedback on the rubric cell
	...timestamps
});

export type RubricCellFeedback = typeof rubricCellFeedback.$inferSelect;
