import { pgTable, text, integer, foreignKey, boolean, unique } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { subjectOffering } from './subjects';
import { learningArea, learningAreaStandard } from './curriculum';
import { rubric } from './task';

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
		color: text('color').default('#3B82F6'),
		imageBase64: text('image_base64'),
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

// if we want to check across the area of study standards,
export const courseMapItemAssessmentPlan = pgTable(
	'cm_item_as_plan',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_item_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		scope: text('scope').array(),
		description: text('description'),
		rubricId: integer('rubric_id')
			.references(() => rubric.id, { onDelete: 'set null' }),
		imageBase64: text('image_base64'),
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

export const assessmentPlanResource = pgTable(
	'assessment_plan_resource',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemAssessmentPlanId: integer('cm_item_as_plan_id')
			.notNull()
			.references(() => courseMapItemAssessmentPlan.id, { onDelete: 'cascade' }),
		resourceId: integer('resource_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
	},
);

export const courseMapItemLessonPlan = pgTable(
	'cm_item_lesson_plan',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_item_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		scope: text('scope').array(),
		description: text('description'),
		imageBase64: text('image_base64'),
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

export const lessonPlanResource = pgTable(
	'lesson_plan_resource',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemLessonPlanId: integer('cm_item_lesson_plan_id')	
			.notNull()
			.references(() => courseMapItemLessonPlan.id, { onDelete: 'cascade' }),
		resourceId: integer('resource_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
	}
);

export type LessonPlanResource = typeof lessonPlanResource.$inferSelect;

export const lessonPlanLearningAreaStandard = pgTable(
	'lesson_plan_la_standard',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemLessonPlanId: integer('cm_item_lesson_plan_id')
			.notNull()
			.references(() => courseMapItemLessonPlan.id, { onDelete: 'cascade' }),
		learningAreaStandardId: integer('la_standard_id')
			.notNull()
			.references(() => learningAreaStandard.id, { onDelete: 'cascade' }),

		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
);
export type LessonPlanLearningAreaStandard = typeof lessonPlanLearningAreaStandard.$inferSelect;

export const assessmentPlanLearningAreaStandard = pgTable(
	'assessment_plan_la_standard',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemAssessmentPlanId: integer('cm_item_as_plan_id')
			.notNull()
			.references(() => courseMapItemAssessmentPlan.id, { onDelete: 'cascade' }),
		learningAreaStandardId: integer('la_standard_id')
			.notNull()
			.references(() => learningAreaStandard.id, { onDelete: 'cascade' }),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
);

export type AssessmentPlanLearningAreaStandard =
	typeof assessmentPlanLearningAreaStandard.$inferSelect;

export const resource = pgTable(
	'resource',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		fileName: text('file_name').notNull(), 
		objectKey: text('object_key').notNull(), 
		bucketName: text('bucket_name').notNull().default('schools'),
		contentType: text('content_type').notNull(),
		fileSize: integer('file_size').notNull(), 
		resourceType: text('resource_type').notNull(), 
		uploadedBy: text('uploaded_by').notNull(),  
		isActive: boolean('is_active').notNull().default(true),
		...timestamps
	}
);

export type Resource = typeof resource.$inferSelect;

export const courseMapItemResource = pgTable(
	'course_map_item_resource',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_item_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		resourceId: integer('resource_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
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

export type CourseMapItemResource = typeof courseMapItemResource.$inferSelect;