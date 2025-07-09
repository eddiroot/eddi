import {
    pgTable,
    text,
    integer,
    time,
    type AnyPgColumn,
    foreignKey,
    interval,
    boolean,
    pgEnum,
    unique
} from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { campus, school, schoolLocation } from './schools';
import { user } from './user';

export const curriculum = pgTable('curriculum', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    name: text('name').notNull(),
    version: text('version').notNull(),
    isArchived: boolean('is_archived').notNull().default(false),
    ...timestamps
});

export type Curriculum = typeof curriculum.$inferSelect;

export const curriculumSubject = pgTable('curriculum_subject', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    curriculumId: integer('curriculum_id')
        .notNull()
        .references(() => curriculum.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isArchived: boolean('is_archived').notNull().default(false),
    ...timestamps
});

export type CurriculumSubject = typeof curriculumSubject.$inferSelect;

export const learningArea = pgTable('learning_area', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    curriculumSubjectId: integer('curriculum_subject_id')
        .notNull()
        .references(() => curriculumSubject.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isArchived: boolean('is_archived').notNull().default(false),
    ...timestamps
});

export type LearningArea = typeof learningArea.$inferSelect;

export const learningAreaContent = pgTable('learning_area_content', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    learningAreaId: integer('learning_area_id')
        .notNull()
        .references(() => learningArea.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    yearLevel: text('year_level').notNull(), // e.g. F,1,2,3,4,5,6,7,8,9,10
    isArchived: boolean('is_archived').notNull().default(false)
});

export type LearningAreaContent = typeof learningAreaContent.$inferSelect;

export const contentElaboration = pgTable('content_elaboration', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    learningAreaContentId: integer('learning_area_content_id')
        .notNull()
        .references(() => learningAreaContent.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    contentElaboration: text('content_elaboration').notNull(),
    isArchived: boolean('is_archived').notNull().default(false)
});

export type ContentElaboration = typeof contentElaboration.$inferSelect;

export const subject = pgTable(
    'subject',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
        name: text('name').notNull(),
        schoolId: integer('school_id')
            .notNull()
            .references(() => school.id, { onDelete: 'cascade' }),
        description: text('description'),
        yearLevel: text('year_level').notNull(), // e.g. F,1,2,3,4,5,6,7,8,9,10
        isArchived: boolean('is_archived').notNull().default(false),
        ...timestamps
    },
    (subject) => [unique().on(subject.schoolId, subject.name)]
);

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
        .references(() => campus.id, { onDelete: 'cascade' }),
    isArchived: boolean('is_archived').notNull().default(false),
    ...timestamps
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
    isArchived: boolean('is_archived').notNull().default(false),
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
    isArchived: boolean('is_archived').notNull().default(false),
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

export const subjectClassAllocation = pgTable('subject_class_allocation', {
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
    isArchived: boolean('is_archived').notNull().default(false),
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
    isArchived: boolean('is_archived').notNull().default(false),
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
        isArchived: boolean('is_archived').notNull().default(false),
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