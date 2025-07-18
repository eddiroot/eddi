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


export enum taskTypeEnum {
	lesson = 'lesson',
	assessment = 'assessment',
	homework = 'homework'
}

export const taskTypeEnumPg = pgEnum('task_type', [
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
		originalId: integer('original_id'),
		version: integer('version').notNull().default(1),
		subjectOfferingId: integer('subject_offering_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
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

export enum taskBlockTypeEnum {
	h1 = 'h1',
	h2 = 'h2',
	h3 = 'h3',
	h4 = 'h4',
	h5 = 'h5',
	h6 = 'h6',
	markdown = 'markdown',
	image = 'image',
	video = 'video',
	audio = 'audio',
	fillInBlank = 'fill_in_blank',
	multipleChoice = 'multiple_choice',
	whiteboard = 'whiteboard',
	matching = 'matching',
	twoColumnLayout = 'two_column_layout',
	shortAnswer = 'short_answer',
}

export const taskBlockTypeEnumPg = pgEnum('task_block_type', [
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

export enum taskStatusEnum {
	draft = 'draft',
	published = 'published',
	locked = 'locked',
	released = 'released'
}

export const taskStatusEnumPg = pgEnum('task_status', [
	taskStatusEnum.draft,
	taskStatusEnum.published,
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
	rubricId: integer('rubric_id')
		.references(() => rubric.id, { onDelete: 'set null' }),
	...timestamps
});

export type SubjectOfferingClassTask = typeof subjectOfferingClassTask.$inferSelect;

export const taskStandard = pgTable('task_standard', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	learningAreaStandardId: integer('la_standard_id')
		.notNull()
		.references(() => learningAreaStandard.id, { onDelete: 'cascade' }),
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
	response: jsonb('response').notNull(),
	marks: doublePrecision('marks'),
	...timestamps
});

export type TaskBlockResponse = typeof taskBlockResponse.$inferSelect;

export const whiteboard = pgTable('whiteboard', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	title: text('title'),
	...timestamps
});

export type Whiteboard = typeof whiteboard.$inferSelect;

export enum whiteboardObjectTypeEnum {
	rect = 'Rect',
	circle = 'Circle',
	path = 'Path',
	textbox = 'Textbox'
}

export const whiteboardObjectTypeEnumPg = pgEnum('whiteboard_object_type', [
	whiteboardObjectTypeEnum.rect,
	whiteboardObjectTypeEnum.circle,
	whiteboardObjectTypeEnum.path,
	whiteboardObjectTypeEnum.textbox
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
	answer: jsonb('answer').notNull(),
	marks: doublePrecision('marks'),
	...timestamps
});

export type Answer = typeof answer.$inferSelect;

export const rubric = pgTable('rubric', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    title: text('title').notNull(),
    ...timestamps
});

export type Rubric = typeof rubric.$inferSelect;

export const criteria = pgTable('criteria', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    taskBlockId: integer('task_block_id').notNull().references(() => taskBlock.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
	marks: doublePrecision('marks').notNull(), // Marks assigned to this criteria 1 or 0.5 etc.
	...timestamps
});

export type Criteria = typeof criteria.$inferSelect;


export const rubricLevelEnum = pgEnum('rubric_level', [
  'exemplary',
  'accomplished',
  'developing',
  'beginning'
]);


export const rubricRow = pgTable('rubric_row', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 2000 }),
  rubricId: integer('rubric_id').notNull().references(() => rubric.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),       
  ...timestamps
});

// Record teacher checks for individual criteria on a task-block response
export const criteriaResponse = pgTable('criteria_response', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  criteriaId: integer('criteria_id')
    .notNull()
    .references(() => criteria.id, { onDelete: 'cascade' }),
  taskBlockResponseId: integer('task_block_response_id')
    .notNull()
    .references(() => taskBlockResponse.id, { onDelete: 'cascade' }),
  met: boolean('met').notNull().default(false), 
  ...timestamps
});

export type CriteriaResponse = typeof criteriaResponse.$inferSelect;

export type RubricRow = typeof rubricRow.$inferSelect;

export const rubricCell = pgTable('rubric_cell', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 3000 }),
  rowId: integer('row_id').notNull().references(() => rubricRow.id, { onDelete: 'cascade' }),
  level: rubricLevelEnum().notNull(),        
  description: text('description').notNull(),
  marks: doublePrecision('marks').notNull(),
  ...timestamps
});

export type RubricCell = typeof rubricCell.$inferSelect;

export const rubricResponse = pgTable('rubric_response', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  rubricId: integer('rubric_id').notNull().references(() => rubric.id, { onDelete: 'cascade' }),
  classTaskId: integer('class_task_id')
    .notNull()
    .references(() => subjectOfferingClassTask.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  ...timestamps
});

export const rubricCellResponse = pgTable('rubric_cell_response', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  rubricResponseId: integer('rubric_response_id')
    .notNull()
    .references(() => rubricResponse.id, { onDelete: 'cascade' }),
  cellId: integer('rubric_cell_id')
    .notNull()
    .references(() => rubricCell.id, { onDelete: 'cascade' }),
  selected: boolean('selected').notNull().default(true),
  ...timestamps
});

export type RubricResponse = typeof rubricResponse.$inferSelect;