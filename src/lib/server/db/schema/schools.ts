import { pgTable, text, integer, boolean, pgEnum, unique, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { user } from './user';

export const school = pgTable('school', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull().unique(),
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
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	campusId: integer('campus_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	...timestamps
});

export type UserCampus = typeof userCampus.$inferSelect;

export const schoolBuilding = pgTable(
	'school_building',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		campusId: integer('campus_id')
			.notNull()
			.references(() => campus.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.campusId, self.name)]
);

export type SchoolBuilding = typeof schoolBuilding.$inferSelect;

export enum schoolSpaceTypeEnum {
	classroom = 'classroom',
	laboratory = 'laboratory',
	gymnasium = 'gymnasium',
	pool = 'pool',
	library = 'library',
	auditorium = 'auditorium'
}

export const schoolSpaceTypeEnumPg = pgEnum('school_location_type', [
	schoolSpaceTypeEnum.classroom,
	schoolSpaceTypeEnum.laboratory,
	schoolSpaceTypeEnum.gymnasium,
	schoolSpaceTypeEnum.pool,
	schoolSpaceTypeEnum.library,
	schoolSpaceTypeEnum.auditorium
]);

export const schoolSpace = pgTable(
	'school_space',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		buildingId: integer('building_id')
			.notNull()
			.references(() => schoolBuilding.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		type: schoolSpaceTypeEnumPg().notNull(),
		capacity: integer('capacity'),
		description: text('description'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.buildingId, self.name)]
);

export type SchoolSpace = typeof schoolSpace.$inferSelect;
