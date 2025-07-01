import { sql } from 'drizzle-orm';
import {
	pgTable,
	text,
	integer,
	timestamp,
	time,
	type AnyPgColumn,
	foreignKey,
	interval,
	boolean,
	jsonb
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
	address: text('address').notNull(), // e.g., '123 Main St, Springfield'
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

export const subjectOffering = pgTable('subject_offering', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	subjectId: integer('subject_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	year: integer('year').notNull() // e.g., 2023
});

export type SubjectOffering = typeof subjectOffering.$inferSelect;

export const userSubjectOffering = pgTable('user_subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subjectOfferingId: integer('subject_offering_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	role: text('role').notNull(), // either 'student', 'teacher', or 'moderator'
	isComplete: integer('is_complete').default(0).notNull(),
	isArchived: integer('is_archived').default(0).notNull(),
	...timestamps
});

export type UserSubjectOffering = typeof userSubjectOffering.$inferSelect;

export const subjectClass = pgTable('subjectClass', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	subjectOfferingId: integer('subject_offering_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	...timestamps
});

export type SubjectClass = typeof subjectClass.$inferSelect;

export const userSubjectClass = pgTable('user_subject_class', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subjectClassId: integer('subject_class_id')
		.notNull()
		.references(() => subjectClass.id, { onDelete: 'cascade' }),
	role: text('role').notNull(), // either 'student' or 'teacher'
	...timestamps
});

export type UserSubjectClass = typeof userSubjectClass.$inferSelect;

export const subjectClassAllocation = pgTable('subject_class_time', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	subjectClassId: integer('subject_class_id')
		.notNull()
		.references(() => subjectClass.id, { onDelete: 'cascade' }),
	schoolLocationId: integer('schoolLocationId')
		.notNull()
		.references(() => schoolLocation.id, { onDelete: 'set null' }),
	dayOfWeek: text('day_of_week').notNull(), // e.g., 'monday', 'tuesday', etc.
	startTime: time('start_time').notNull(), // consider period in future
	duration: interval('duration').notNull(), // e.g., '01:00:00' for 1 hour
	...timestamps
});

export type SubjectClassAllocation = typeof subjectClassAllocation.$inferSelect;

export const schoolLocation = pgTable('school_location', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(), // e.g., 'Room 101', 'Science Lab A', 'Gymnasium'
	type: text('type').notNull(), // e.g., 'classroom', 'laboratory', 'gymnasium', 'auditorium', 'online'
	capacity: integer('capacity'), // optional - max number of students
	description: text('description'), // optional additional details
	isActive: boolean('is_active').default(true).notNull(), // 1 for active, 0 for inactive
	...timestamps
});

export type SchoolLocation = typeof schoolLocation.$inferSelect;

export const subjectThread = pgTable('sub_thread', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	type: text('type').notNull(), // either 'discussion', 'question', 'announcement', or 'qanda'
	subjectOfferingId: integer('subject_offering_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
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

export const lessonTopic = pgTable('lesson_topic', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull(), // e.g., 'Algebra', 'Geometry', etc.
	index: integer('index').notNull(), // e.g., 1, 2, 3, etc. for ordering
	subjectClassId: integer('subject_class_id')
		.notNull()
		.references(() => subjectClass.id, { onDelete: 'cascade' }),
	...timestamps
});

export type LessonTopic = typeof lessonTopic.$inferSelect;

export const lesson = pgTable('lesson', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	title: text('title').notNull(),
	type: text('type').notNull().default('lesson'), // either 'lesson', 'assignment', or 'homework'
	description: text('description').notNull(),
	lessonStatus: text('status').notNull(), // either 'draft', 'published', or 'archived'
	index: integer('index').notNull(),
	lessonTopicId: integer('lesson_topic_id')
		.notNull()
		.references(() => lessonTopic.id, { onDelete: 'cascade' }),
	dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' }),
	...timestamps
});

export type Lesson = typeof lesson.$inferSelect;

export const lessonBlock = pgTable('lesson_block', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	lessonId: integer('lesson_id')
		.notNull()
		.references(() => lesson.id, { onDelete: 'cascade' }),
	type: text('type').notNull(),
	content: jsonb('content').notNull(),
	index: integer('index').notNull().default(0),
	...timestamps
});

export type LessonBlock = typeof lessonBlock.$inferSelect;

export const whiteboard = pgTable('whiteboard', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	lessonId: integer('lesson_id')
		.notNull()
		.references(() => lesson.id, { onDelete: 'cascade' }),
	title: text('title'),
	...timestamps
});

export type Whiteboard = typeof whiteboard.$inferSelect;

export const whiteboardObject = pgTable('whiteboard_object', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	whiteboardId: integer('whiteboard_id')
		.notNull()
		.references(() => whiteboard.id, { onDelete: 'cascade' }),
	objectId: text('object_id').notNull().unique(),
	objectType: text('object_type').notNull(), // 'rect', 'circle', 'path', 'textbox', etc.
	objectData: jsonb('object_data').notNull(),
	...timestamps
});

export type WhiteboardObject = typeof whiteboardObject.$inferSelect;

export const chatbotChat = pgTable('chatbot_chat', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	...timestamps
});

export type ChatbotChat = typeof chatbotChat.$inferSelect;

export const chatbotMessage = pgTable('chatbot_message', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	authorId: text('author_id').references(() => user.id, { onDelete: 'cascade' }),
	chatId: integer('chat_id')
		.notNull()
		.references(() => chatbotChat.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	...timestamps
});

export type ChatbotMessage = typeof chatbotMessage.$inferSelect;
