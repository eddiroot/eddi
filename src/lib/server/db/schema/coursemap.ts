import { pgTable, text, integer, foreignKey, boolean, unique } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { subjectOffering } from './subjects';
import { learningArea } from './curriculum';

export const courseMapItem = pgTable(
	'course_map_item',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		topic: text('topic').notNull(),
		description: text('description'),
		startWeek: integer('start_week'),
		duration: integer('duration'),
		semester: integer('semester'),
		color: text('color').default('100'),
		originalId: integer('original_id'),
		version: integer('version').notNull().default(1),
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

export type CourseMapItem = typeof courseMapItem.$inferSelect;

export const courseMapItemLearningArea = pgTable(
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
		version: integer('version').notNull().default(1),
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

export type CourseMapItemLearningArea = typeof courseMapItemLearningArea.$inferSelect;

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
		version: integer('version').notNull().default(1),
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
		version: integer('version').notNull().default(1),
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
		version: integer('version').notNull().default(1),
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
