import { pgTable, text, integer, boolean, pgEnum, unique } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { schoolSpaceTypeEnum } from '../../../enums';

export const school = pgTable('sch', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull().unique(),
	logoUrl: text('logo_url'),
	...timestamps
});

export type School = typeof school.$inferSelect;

export const campus = pgTable('cmps', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('sch_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	address: text('address').notNull(),
	description: text('description'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Campus = typeof campus.$inferSelect;

export const schoolBuilding = pgTable(
	'sch_bldng',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		campusId: integer('cmps_id')
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

export const schoolSpaceTypeEnumPg = pgEnum('enum_sch_space_type', [
	schoolSpaceTypeEnum.classroom,
	schoolSpaceTypeEnum.laboratory,
	schoolSpaceTypeEnum.gymnasium,
	schoolSpaceTypeEnum.pool,
	schoolSpaceTypeEnum.library,
	schoolSpaceTypeEnum.auditorium
]);

export const schoolSpace = pgTable(
	'sch_space',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		buildingId: integer('sch_bldng_id')
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
