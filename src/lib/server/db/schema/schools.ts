import { pgTable, text, integer, boolean, pgEnum, unique } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { user } from './user';
import { subject } from './subjects';

export const school = pgTable('school', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull().unique(),
	emailSuffix: text('email_suffix').notNull().unique(),
	logoUrl: text('logo_url'),
	...timestamps
});

export type School = typeof school.$inferSelect;

export const campus = pgTable('campus', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	address: text('address').notNull(),
	description: text('description'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Campus = typeof campus.$inferSelect;

export const userCampus = pgTable('user_campus', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	campusId: integer('campus_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	...timestamps
});

export type UserCampus = typeof userCampus.$inferSelect;

export enum schoolLocationTypeEnum {
	classroom = 'classroom',
	laboratory = 'laboratory',
	gymnasium = 'gymnasium',
	pool = 'pool',
	library = 'library',
	auditorium = 'auditorium',
	online = 'online'
}

export const schoolLocationTypeEnumPg = pgEnum('school_location_type', [
	schoolLocationTypeEnum.classroom,
	schoolLocationTypeEnum.laboratory,
	schoolLocationTypeEnum.gymnasium,
	schoolLocationTypeEnum.pool,
	schoolLocationTypeEnum.library,
	schoolLocationTypeEnum.auditorium,
	schoolLocationTypeEnum.online
]);

export const schoolLocation = pgTable(
	'school_location',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		campusId: integer('campus_id')
			.notNull()
			.references(() => campus.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		type: schoolLocationTypeEnumPg().notNull(),
		capacity: integer('capacity'),
		description: text('description'),
		isArchived: boolean('is_active').notNull().default(false),
		...timestamps
	},
	(location) => [unique().on(location.campusId, subject.name)]
);

export type SchoolLocation = typeof schoolLocation.$inferSelect;
