import { boolean, integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { yearLevelEnum } from '../../../enums';
import { timestamps } from './utils';

export const curriculum = pgTable('crclm', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	version: text('version').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Curriculum = typeof curriculum.$inferSelect;

export const curriculumSubject = pgTable('crclm_sub', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	curriculumId: integer('cur_id')
		.notNull()
		.references(() => curriculum.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type CurriculumSubject = typeof curriculumSubject.$inferSelect;

export const learningArea = pgTable('crclm_sub_la', {
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

export const learningAreaContent = pgTable('lrn_a_cont', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaId: integer('lrn_a_id')
		.notNull()
		.references(() => learningArea.id, { onDelete: 'cascade' }),
	description: text('description').notNull(),
	number: integer('number').notNull(), // e.g. dot point 1/2/3
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type LearningAreaContent = typeof learningAreaContent.$inferSelect;

export const yearLevelEnumPg = pgEnum('enum_year_level', [
	yearLevelEnum.none,
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
	yearLevelEnum.year10A,
	yearLevelEnum.year11,
	yearLevelEnum.year12,
	yearLevelEnum.year13
]);

export const learningAreaStandard = pgTable('lrn_a_std', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaId: integer('lrn_a_id')
		.notNull()
		.references(() => learningArea.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	yearLevel: yearLevelEnumPg().notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type LearningAreaStandard = typeof learningAreaStandard.$inferSelect;

export const standardElaboration = pgTable('lrn_a_std_elab', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaStandardId: integer('lrn_a_std_id')
		.notNull()
		.references(() => learningAreaStandard.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	standardElaboration: text('std_elab').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type StandardElaboration = typeof standardElaboration.$inferSelect;

export const outcome = pgTable('outcome', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	number: integer('number').notNull(),
	description: text('description').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Outcome = typeof outcome.$inferSelect;

export const learningAreaOutcome = pgTable('lrn_a_outcome', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaId: integer('lrn_a_id')
		.notNull()
		.references(() => learningArea.id, { onDelete: 'cascade' }),
	outcomeId: integer('out_id')
		.notNull()
		.references(() => outcome.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type LearningAreaOutcome = typeof learningAreaOutcome.$inferSelect;


export const keySkill = pgTable('key_skill', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	description: text('description').notNull(),
	outcomeId: integer('out_id')
		.references(() => outcome.id, { onDelete: 'cascade' }),
	curriculumSubjectId: integer('cur_sub_id')
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	number: integer('number').notNull(), // e.g. 1/2/3
	topicName: text('topic_name'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type KeySkill = typeof keySkill.$inferSelect;

export const keyKnowledge = pgTable('key_knowledge', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	description: text('description').notNull(),
	outcomeId: integer('out_id')
		.references(() => outcome.id, { onDelete: 'cascade' }),
	topicName: text('topic_name'),
	curriculumSubjectId: integer('cur_sub_id')
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	number: integer('number').notNull(), // e.g. 1/2/3
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type KeyKnowledge = typeof keyKnowledge.$inferSelect;
