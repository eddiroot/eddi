import { pgTable, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { school } from './schools';

export enum userTypeEnum {
	student = 'student',
	teacher = 'teacher',
	guardian = 'guardian',
	principal = 'principal',
	schoolAdmin = 'schoolAdmin',
	systemAdmin = 'systemAdmin'
}

export const userTypeEnumPg = pgEnum('user_type', [
	userTypeEnum.student,
	userTypeEnum.teacher,
	userTypeEnum.guardian,
	userTypeEnum.principal,
	userTypeEnum.schoolAdmin,
	userTypeEnum.systemAdmin
]);

export enum userHonorificEnum {
	mr = 'Mr',
	ms = 'Ms',
	mrs = 'Mrs',
	dr = 'Dr',
	prof = 'Prof'
}

export const userHonorificEnumPg = pgEnum('user_honorific', [
	userHonorificEnum.mr,
	userHonorificEnum.ms,
	userHonorificEnum.mrs,
	userHonorificEnum.dr,
	userHonorificEnum.prof
]);

export enum userGenderEnum {
	male = 'male',
	female = 'female',
	nonBinary = 'non-binary',
	other = 'other',
	unspecified = 'unspecified'
}

export const userGenderEnumPg = pgEnum('gender', [
	userGenderEnum.male,
	userGenderEnum.female,
	userGenderEnum.nonBinary,
	userGenderEnum.other,
	userGenderEnum.unspecified
]);

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	type: userTypeEnumPg().notNull(),
	gender: userGenderEnumPg(),
	dateOfBirth: timestamp('date_of_birth', { withTimezone: true, mode: 'date' }),
	honorific: userHonorificEnumPg(),
	firstName: text('first_name').notNull(),
	middleName: text('middle_name'),
	lastName: text('last_name').notNull(),
	avatarUrl: text('avatar_url'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type User = typeof user.$inferSelect;

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	...timestamps
});

export type Session = typeof session.$inferSelect;
