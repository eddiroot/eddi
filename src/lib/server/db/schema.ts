import { sql } from 'drizzle-orm';
import {
	pgTable,
	text,
	integer,
	timestamp,
	type AnyPgColumn,
	foreignKey
} from 'drizzle-orm/pg-core';

// TODO: Replace text with enum for type and role fields

const timestamps = {
	createdAt: timestamp({ withTimezone: true, mode: 'string' })
		.default(sql`(now() AT TIME ZONE 'utc'::text)`)
		.notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' })
		.default(sql`(now() AT TIME ZONE 'utc'::text)`)
		.notNull()
		.$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`)
};

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	type: text('type').notNull(), // either 'student', 'teacher', 'principal', 'schoolAdmin', or 'systemAdmin'
	firstName: text('first_name').notNull(),
	middleName: text('middle_name'),
	lastName: text('last_name').notNull(),
	avatarUrl: text('avatar_url'),
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

export const school = pgTable('school', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull().unique(),
	...timestamps
});

export type School = typeof school.$inferSelect;

export const subject = pgTable('subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	...timestamps
});

export type Subject = typeof subject.$inferSelect;

export const userSubject = pgTable('user_subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subjectId: integer('subject_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	year: integer('year').notNull(),
	role: text('role').notNull(), // either 'student', 'teacher', or 'moderator'
	isComplete: integer('is_complete').default(0).notNull(),
	isArchived: integer('is_archived').default(0).notNull(),
	...timestamps
});

export type UserSubject = typeof userSubject.$inferSelect;

export const subjectThread = pgTable('sub_thread', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	type: text('type').notNull(), // either 'discussion', 'question', 'announcement', or 'qanda'
	subjectId: integer('subject_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	content: text('content').notNull(),
	...timestamps
});

export type SubjectThread = typeof subjectThread.$inferSelect;

export const subjectThreadResponse = pgTable(
	'sub_thread_response',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
		type: text('type').notNull(), // either 'comment' or 'answer'
		subjectThreadId: integer('subject_thread_id')
			.notNull()
			.references(() => subjectThread.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		parentResponseId: integer('parent_id').references((): AnyPgColumn => subjectThreadResponse.id),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.parentResponseId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

export type SubjectThreadResponse = typeof subjectThreadResponse.$inferSelect;

export const lesson = pgTable('lesson', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	subjectId: integer('subject_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	subjectWeek: integer('subject_week').notNull(),
	title: text('title').notNull(),
	description: text('description'),
	...timestamps
});

export type Lesson = typeof lesson.$inferSelect;

export const lessonSection = pgTable('lesson_section', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	lessonId: integer('lesson_id')
		.notNull()
		.references(() => lesson.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	...timestamps
});

export type LessonSection = typeof lessonSection.$inferSelect;

export const lessonSectionBlock = pgTable('lesson_section_block', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	subjectLessonSectionId: integer('lesson_section_id')
		.notNull()
		.references(() => lessonSection.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description').notNull(),
	type: text('type').notNull(), // either 'text', 'audio', 'image', 'input', 'textArea', 'mcSingle', or 'mcMulti'
	...timestamps
});

export type LessonSectionBlock = typeof lessonSectionBlock.$inferSelect;
