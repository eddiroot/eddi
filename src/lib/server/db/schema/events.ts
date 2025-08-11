import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { campus } from './schools';
import { subjectOfferingClass } from './subjects';

// Things like athletics day, school fair, etc.
// Visible to all users in the campus
export const schoolEvent = pgTable('sch_evt', {
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

export type SchoolEvent = typeof schoolEvent.$inferSelect;

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
