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
	schoolAdmin = 'schoolAdmin'
}

export const userTypeEnumPg = pgEnum('user_type', [
	userTypeEnum.student,
	userTypeEnum.teacher,
	userTypeEnum.principal,
	userTypeEnum.schoolAdmin
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
	...timestamps
});

export type School = typeof school.$inferSelect;

export const campus = pgTable('school_campus', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	address: text('address').notNull(),
	description: text('description'),
	isActive: boolean('is_active').notNull().default(true),
	...timestamps
});

export type SchoolCampus = typeof campus.$inferSelect;

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

export const schoolLocation = pgTable('school_location', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	campusId: integer('campus_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	type: schoolLocationTypeEnumPg().notNull(),
	capacity: integer('capacity'),
	description: text('description'),
	isActive: boolean('is_active').notNull().default(true),
	...timestamps
});

export type SchoolLocation = typeof schoolLocation.$inferSelect;

export const subject = pgTable('subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	description: text('description'),
	...timestamps
});

export type Subject = typeof subject.$inferSelect;

export const subjectOffering = pgTable('subject_offering', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectId: integer('subject_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	year: integer('year').notNull(),
	semester: integer('semester').notNull(),
	campusId: integer('campus_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' })
});

export type SubjectOffering = typeof subjectOffering.$inferSelect;

export enum userSubjectOfferingRoleEnum {
	student = 'student',
	teacher = 'teacher',
	moderator = 'moderator'
}

export const userSubjectOfferingRoleEnumPg = pgEnum('user_subject_offering_role', [
	userSubjectOfferingRoleEnum.student,
	userSubjectOfferingRoleEnum.teacher,
	userSubjectOfferingRoleEnum.moderator
]);

export const userSubjectOffering = pgTable('user_subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subjectOfferingId: integer('subject_offering_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	role: userSubjectOfferingRoleEnumPg().notNull(),
	isComplete: integer('is_complete').default(0).notNull(),
	isArchived: integer('is_archived').default(0).notNull(),
	color: integer('color').default(100).notNull(),
	...timestamps
});

export type UserSubjectOffering = typeof userSubjectOffering.$inferSelect;

export const subjectClass = pgTable('subject_class', {
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

export const userSubjectClassRoleEnumPg = pgEnum('user_subject_class_role', [
	userSubjectClassRoleEnum.student,
	userSubjectClassRoleEnum.teacher
]);

export const userSubjectClass = pgTable('user_subject_class', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subjectClassId: integer('subject_class_id')
		.notNull()
		.references(() => subjectClass.id, { onDelete: 'cascade' }),
	role: userSubjectClassRoleEnumPg().notNull(),
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

export const dayOfWeekEnumPg = pgEnum('day_of_week', [
	dayOfWeekEnum.monday,
	dayOfWeekEnum.tuesday,
	dayOfWeekEnum.wednesday,
	dayOfWeekEnum.thursday,
	dayOfWeekEnum.friday,
	dayOfWeekEnum.saturday,
	dayOfWeekEnum.sunday
]);

export const subjectClassAllocation = pgTable('subject_class_time', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectClassId: integer('subject_class_id')
		.notNull()
		.references(() => subjectClass.id, { onDelete: 'cascade' }),
	schoolLocationId: integer('schoolLocationId')
		.notNull()
		.references(() => schoolLocation.id, { onDelete: 'set null' }),
	dayOfWeek: dayOfWeekEnumPg().notNull(),
	startTime: time('start_time').notNull(),
	duration: interval('duration').notNull(),
	...timestamps
});

export type SubjectClassAllocation = typeof subjectClassAllocation.$inferSelect;

export enum subjectThreadTypeEnum {
	discussion = 'discussion',
	question = 'question',
	announcement = 'announcement',
	qanda = 'qanda'
}

export const subjectThreadTypeEnumPg = pgEnum('subject_thread_type', [
	subjectThreadTypeEnum.discussion,
	subjectThreadTypeEnum.question,
	subjectThreadTypeEnum.announcement,
	subjectThreadTypeEnum.qanda
]);

export const subjectThread = pgTable('sub_thread', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	type: subjectThreadTypeEnumPg().notNull(),
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

export const subjectThreadResponseTypeEnumPg = pgEnum('subject_thread_response_type', [
	subjectThreadResponseTypeEnum.comment,
	subjectThreadResponseTypeEnum.answer
]);

export const subjectThreadResponse = pgTable(
	'sub_thread_response',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		type: subjectThreadResponseTypeEnumPg().notNull(),
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

export const lessonTypeEnumPg = pgEnum('lesson_type', [
	lessonTypeEnum.lesson,
	lessonTypeEnum.assessment,
	lessonTypeEnum.homework
]);

export const lessonStatusEnumPg = pgEnum('lesson_status', [
	lessonStatusEnum.draft,
	lessonStatusEnum.published,
	lessonStatusEnum.archived
]);

export const lesson = pgTable('lesson', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	title: text('title').notNull(),
	type: lessonTypeEnumPg().notNull(),
	description: text('description').notNull(),
	// Cannot use 'status' as a column name because it is a reserved keyword in PostgreSQL
	lessonStatus: lessonStatusEnumPg().notNull(),
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
	audio = 'audio',
	fillInBlank = 'fill_in_blank',
	multipleChoice = 'multiple_choice',
	whiteboard = 'whiteboard',
	matching = 'matching',
	twoColumnLayout = 'two_column_layout'
}

export const lessonBlockTypeEnumPg = pgEnum('lesson_block_type', [
	lessonBlockTypeEnum.h1,
	lessonBlockTypeEnum.h2,
	lessonBlockTypeEnum.h3,
	lessonBlockTypeEnum.h4,
	lessonBlockTypeEnum.h5,
	lessonBlockTypeEnum.h6,
	lessonBlockTypeEnum.markdown,
	lessonBlockTypeEnum.image,
	lessonBlockTypeEnum.video,
	lessonBlockTypeEnum.audio,
	lessonBlockTypeEnum.fillInBlank,
	lessonBlockTypeEnum.multipleChoice,
	lessonBlockTypeEnum.whiteboard,
	lessonBlockTypeEnum.matching,
	lessonBlockTypeEnum.twoColumnLayout
]);

export const lessonBlock = pgTable('lesson_block', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	lessonId: integer('lesson_id')
		.notNull()
		.references(() => lesson.id, { onDelete: 'cascade' }),
	type: lessonBlockTypeEnumPg().notNull(),
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
	rect = 'Rect',
	circle = 'Circle',
	path = 'Path',
	textbox = 'Textbox'
}

export const whiteboardObjectTypeEnumPg = pgEnum('whiteboard_object_type', [
	whiteboardObjectTypeEnum.rect,
	whiteboardObjectTypeEnum.circle,
	whiteboardObjectTypeEnum.path,
	whiteboardObjectTypeEnum.textbox
]);

export const whiteboardObject = pgTable('whiteboard_object', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	whiteboardId: integer('whiteboard_id')
		.notNull()
		.references(() => whiteboard.id, { onDelete: 'cascade' }),
	objectId: text('object_id').notNull().unique(),
	objectType: whiteboardObjectTypeEnumPg().notNull(),
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
