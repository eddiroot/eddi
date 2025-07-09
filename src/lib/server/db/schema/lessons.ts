import {
    pgTable,
    text,
    integer,
    timestamp,
    boolean,
    jsonb,
    pgEnum,
} from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { subjectClass } from './subjects';

export const lessonTopic = pgTable('lesson_topic', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    name: text('name').notNull(),
    index: integer('index').notNull(),
    subjectClassId: integer('subject_class_id')
        .notNull()
        .references(() => subjectClass.id, { onDelete: 'cascade' }),
    isArchived: boolean('is_archived').notNull().default(false),
    ...timestamps
});

export type LessonTopic = typeof lessonTopic.$inferSelect;

export enum lessonTypeEnum {
    lesson = 'lesson',
    assessment = 'assessment',
    homework = 'homework'
}

export enum lessonStatusEnum {
    draft = 'draft',
    published = 'published',
    archived = 'archived'
}

export const lessonTypeEnumPg = pgEnum('lesson_type', [
    lessonTypeEnum.lesson,
    lessonTypeEnum.assessment,
    lessonTypeEnum.homework
]);

export const lessonStatusEnumPg = pgEnum('lesson_status', [
    lessonStatusEnum.draft,
    lessonStatusEnum.published,
    lessonStatusEnum.archived
]);

export const lesson = pgTable('lesson', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    title: text('title').notNull(),
    type: lessonTypeEnumPg().notNull(),
    description: text('description').notNull(),
    // Cannot use 'status' as a column name because it is a reserved keyword in PostgreSQL
    lessonStatus: lessonStatusEnumPg().notNull(),
    index: integer('index').notNull(),
    lessonTopicId: integer('lesson_topic_id')
        .notNull()
        .references(() => lessonTopic.id, { onDelete: 'cascade' }),
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' }),
    isArchived: boolean('is_archived').notNull().default(false),
    ...timestamps
});

export type Lesson = typeof lesson.$inferSelect;

export enum lessonBlockTypeEnum {
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

export const lessonBlockTypeEnumPg = pgEnum('lesson_block_type', [
    lessonBlockTypeEnum.h1,
    lessonBlockTypeEnum.h2,
    lessonBlockTypeEnum.h3,
    lessonBlockTypeEnum.h4,
    lessonBlockTypeEnum.h5,
    lessonBlockTypeEnum.h6,
    lessonBlockTypeEnum.markdown,
    lessonBlockTypeEnum.image,
    lessonBlockTypeEnum.video,
    lessonBlockTypeEnum.audio,
    lessonBlockTypeEnum.fillInBlank,
    lessonBlockTypeEnum.multipleChoice,
    lessonBlockTypeEnum.whiteboard,
    lessonBlockTypeEnum.matching,
    lessonBlockTypeEnum.twoColumnLayout
]);

export const lessonBlock = pgTable('lesson_block', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    lessonId: integer('lesson_id')
        .notNull()
        .references(() => lesson.id, { onDelete: 'cascade' }),
    type: lessonBlockTypeEnumPg().notNull(),
    content: jsonb('content').notNull(),
    index: integer('index').notNull().default(0),
    ...timestamps
});

export type LessonBlock = typeof lessonBlock.$inferSelect;

export const whiteboard = pgTable('whiteboard', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    lessonId: integer('lesson_id')
        .notNull()
        .references(() => lesson.id, { onDelete: 'cascade' }),
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