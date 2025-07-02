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
	jsonb,
	pgEnum
} from 'drizzle-orm/pg-core';

const timestamps = {
	createdAt: timestamp({ withTimezone: true, mode: 'string' })
		.default(sql`(now() AT TIME ZONE 'utc'::text)`)
		.notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' })
		.default(sql`(now() AT TIME ZONE 'utc'::text)`)
		.notNull()
		.$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`)
};

export enum userTypeEnum {
	student = 'student',
	teacher = 'teacher',
	principal = 'principal',
	schoolAdmin = 'schoolAdmin',
	systemAdmin = 'systemAdmin'
}

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	type: pgEnum('type', userTypeEnum)().notNull(),
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
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull().unique(),
	address: text('address').notNull(),
	...timestamps
});

export type School = typeof school.$inferSelect;

export const subject = pgTable('subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	...timestamps
});

export type Subject = typeof subject.$inferSelect;

export const subjectOffering = pgTable('subject_offering', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectId: integer('subject_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	year: integer('year').notNull()
});

export type SubjectOffering = typeof subjectOffering.$inferSelect;

export enum userSubjectOfferingRoleEnum {
	student = 'student',
	teacher = 'teacher',
	moderator = 'moderator'
}

export const userSubjectOffering = pgTable('user_subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subjectOfferingId: integer('subject_offering_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	role: pgEnum('role', userSubjectOfferingRoleEnum)().notNull(),
	isComplete: integer('is_complete').default(0).notNull(),
	isArchived: integer('is_archived').default(0).notNull(),
	color: integer('color').default(100).notNull(),
	...timestamps
});

export type UserSubjectOffering = typeof userSubjectOffering.$inferSelect;

export const subjectClass = pgTable('subjectClass', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingId: integer('subject_offering_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	...timestamps
});

export type SubjectClass = typeof subjectClass.$inferSelect;

export enum userSubjectClassRoleEnum {
	student = 'student',
	teacher = 'teacher'
}

export const userSubjectClass = pgTable('user_subject_class', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subjectClassId: integer('subject_class_id')
		.notNull()
		.references(() => subjectClass.id, { onDelete: 'cascade' }),
	role: pgEnum('role', userSubjectClassRoleEnum)().notNull(),
	...timestamps
});

export type UserSubjectClass = typeof userSubjectClass.$inferSelect;

export enum dayOfWeekEnum {
	monday = 'monday',
	tuesday = 'tuesday',
	wednesday = 'wednesday',
	thursday = 'thursday',
	friday = 'friday',
	saturday = 'saturday',
	sunday = 'sunday'
}

export const subjectClassAllocation = pgTable('subject_class_time', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectClassId: integer('subject_class_id')
		.notNull()
		.references(() => subjectClass.id, { onDelete: 'cascade' }),
	schoolLocationId: integer('schoolLocationId')
		.notNull()
		.references(() => schoolLocation.id, { onDelete: 'set null' }),
	dayOfWeek: pgEnum('day_of_week', dayOfWeekEnum)().notNull(),
	startTime: time('start_time').notNull(),
	duration: interval('duration').notNull(),
	...timestamps
});

export type SubjectClassAllocation = typeof subjectClassAllocation.$inferSelect;

export enum schoolLocationTypeEnum {
	classroom = 'classroom',
	laboratory = 'laboratory',
	gymnasium = 'gymnasium',
	pool = 'pool',
	library = 'library',
	auditorium = 'auditorium',
	online = 'online'
}

export const schoolLocation = pgTable('school_location', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	type: pgEnum('type', schoolLocationTypeEnum)().notNull(),
	capacity: integer('capacity'),
	description: text('description'),
	isActive: boolean('is_active').notNull().default(true),
	...timestamps
});

export type SchoolLocation = typeof schoolLocation.$inferSelect;

export enum subjectThreadTypeEnum {
	discussion = 'discussion',
	question = 'question',
	announcement = 'announcement',
	qanda = 'qanda'
}

export const subjectThread = pgTable('sub_thread', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	type: pgEnum('type', subjectThreadTypeEnum)().notNull(),
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

export enum subjectThreadResponseTypeEnum {
	comment = 'comment',
	answer = 'answer'
}

export const subjectThreadResponse = pgTable(
	'sub_thread_response',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		type: pgEnum('type', subjectThreadResponseTypeEnum)().notNull(),
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
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	index: integer('index').notNull(),
	subjectClassId: integer('subject_class_id')
		.notNull()
		.references(() => subjectClass.id, { onDelete: 'cascade' }),
	...timestamps
});

export type LessonTopic = typeof lessonTopic.$inferSelect;

export enum lessonTypeEnum {
	lesson = 'lesson',
	assessment = 'assessment',
	homework = 'homework'
}

export enum lessonStatusEnum {
	draft = 'draft',
	published = 'published',
	archived = 'archived'
}

export const lesson = pgTable('lesson', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	title: text('title').notNull(),
	type: pgEnum('type', lessonTypeEnum)().notNull(),
	description: text('description').notNull(),
	// Cannot use 'status' as a column name because it is a reserved keyword in PostgreSQL
	lessonStatus: pgEnum('lesson_status', lessonStatusEnum)().notNull(),
	index: integer('index').notNull(),
	lessonTopicId: integer('lesson_topic_id')
		.notNull()
		.references(() => lessonTopic.id, { onDelete: 'cascade' }),
	dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' }),
	...timestamps
});

export type Lesson = typeof lesson.$inferSelect;

export enum lessonBlockTypeEnum {
	h1 = 'h1',
	h2 = 'h2',
	h3 = 'h3',
	h4 = 'h4',
	h5 = 'h5',
	h6 = 'h6',
	markdown = 'markdown',
	image = 'image',
	video = 'video',
	audio = 'audio'
}

export const lessonBlock = pgTable('lesson_block', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	lessonId: integer('lesson_id')
		.notNull()
		.references(() => lesson.id, { onDelete: 'cascade' }),
	type: pgEnum('type', lessonBlockTypeEnum)().notNull(),
	content: jsonb('content').notNull(),
	index: integer('index').notNull().default(0),
	...timestamps
});

export type LessonBlock = typeof lessonBlock.$inferSelect;

export const whiteboard = pgTable('whiteboard', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	lessonId: integer('lesson_id')
		.notNull()
		.references(() => lesson.id, { onDelete: 'cascade' }),
	title: text('title'),
	...timestamps
});

export type Whiteboard = typeof whiteboard.$inferSelect;

export enum whiteboardObjectTypeEnum {
	rect = 'rect',
	circle = 'circle',
	path = 'path',
	textbox = 'textbox',
	image = 'image'
}

export const whiteboardObject = pgTable('whiteboard_object', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	whiteboardId: integer('whiteboard_id')
		.notNull()
		.references(() => whiteboard.id, { onDelete: 'cascade' }),
	objectId: text('object_id').notNull().unique(),
	objectType: pgEnum('object_type', whiteboardObjectTypeEnum)().notNull(),
	objectData: jsonb('object_data').notNull(),
	...timestamps
});

export type WhiteboardObject = typeof whiteboardObject.$inferSelect;

export const chatbotChat = pgTable('chatbot_chat', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	...timestamps
});

export type ChatbotChat = typeof chatbotChat.$inferSelect;

export const chatbotMessage = pgTable('chatbot_message', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	authorId: text('author_id').references(() => user.id, { onDelete: 'cascade' }),
	chatId: integer('chat_id')
		.notNull()
		.references(() => chatbotChat.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	...timestamps
});

export type ChatbotMessage = typeof chatbotMessage.$inferSelect;
