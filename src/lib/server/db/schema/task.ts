import { pgTable, text, integer, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';

export enum taskTypeEnum {
	lesson = 'lesson',
	assessment = 'assessment',
	homework = 'homework'
}

export enum taskStatusEnum {
	draft = 'draft',
	published = 'published',
	archived = 'archived'
}

export const taskTypeEnumPg = pgEnum('task_type', [
	taskTypeEnum.lesson,
	taskTypeEnum.assessment,
	taskTypeEnum.homework
]);

export const task = pgTable('task', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	title: text('title').notNull(),
	type: taskTypeEnumPg().notNull(),
	description: text('description').notNull(),
	index: integer('index').notNull(),
	dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' }),
	isPublished: boolean('is_published').notNull().default(false),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type task = typeof task.$inferSelect;

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
	twoColumnLayout = 'two_column_layout'
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
	taskBlockTypeEnum.twoColumnLayout
]);

export const taskBlock = pgTable('task_block', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	type: taskBlockTypeEnumPg().notNull(),
	content: jsonb('content').notNull(),
	index: integer('index').notNull().default(0),
	...timestamps
});

export type taskBlock = typeof taskBlock.$inferSelect;

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
