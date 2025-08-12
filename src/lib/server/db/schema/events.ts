import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { campus, school } from './schools';
import { subjectOffering, subjectOfferingClass } from './subjects';

// Things like whole school assemblies, school fairs etc
export const schoolEvent = pgTable('sch_evt', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('sch_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	startTimestamp: timestamp('start_ts').notNull(),
	endTimestamp: timestamp('end_ts').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SchoolEvent = typeof schoolEvent.$inferSelect;

// Per-campus athletics days, swimming carnivals, etc
export const campusEvent = pgTable('cmps_evt', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	campusId: integer('cmps_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	startTimestamp: timestamp('start_ts').notNull(),
	endTimestamp: timestamp('end_ts').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type CampusEvent = typeof campusEvent.$inferSelect;

// Things like a year 8 geography excursion, or a subject-level exam
export const subjectOfferingEvent = pgTable('sub_off_evt', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingId: integer('sub_off_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	startTimestamp: timestamp('start_ts').notNull(),
	endTimestamp: timestamp('end_ts').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectOfferingEvent = typeof subjectOfferingEvent.$inferSelect;

// Thing like a class test or a class excursion
export const subjectOfferingClassEvent = pgTable('sub_off_cls_evt', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingClassId: integer('sub_off_cls_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	startTimestamp: timestamp('start_ts').notNull(),
	endTimestamp: timestamp('end_ts').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectOfferingClassEvent = typeof subjectOfferingClassEvent.$inferSelect;
