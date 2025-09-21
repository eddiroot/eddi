import { boolean, integer, jsonb, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import * as table from './index';
import { timestamps } from './index';

// Enum for difficulty levels
export const difficultyLevelEnum = pgEnum('difficulty_level', [
    'beginner',
    'intermediate',
    'advanced',
    'expert'
]);

// Enum for response evaluation
export const evaluationResultEnum = pgEnum('evaluation_result', [
    'accurate',
    'mostly_accurate', 
    'inaccurate',
    'critical_error'
]);

export const sessionTypeEnum = pgEnum('session_type', [
    'teach',
    'train'
]); 

// Main teach me modules
export const module = pgTable('module', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    subjectId: integer('subject_id')
        .notNull()
        .references(() => table.subject.id),
    title: text('title').notNull(),
    description: text('description'),
    objective: text('objective'),
    // Module metadata
    orderIndex: integer('order_index').notNull().default(0),
    isPublished: boolean('is_published').default(false),
    ...timestamps
});

export const moduleSubTask = pgTable('module_sub_task', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    moduleId: integer('module_id')
        .notNull()
        .references(() => module.id),
    taskId: integer("task_id")
        .notNull()
        .references(() => table.task.id),
    objective: text('objective').notNull(),
    concepts: text('concepts').array().notNull().default([]),
    skills: text('skills').array().notNull().default([]),
    orderIndex: integer('order_index').notNull(),

});

// User session tracking (temporary, cleared after module completion)
export const moduleSession = pgTable('module_session', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    userId: uuid('user_id')
        .notNull()
        .references(() => table.user.id),
    moduleId: integer('module_id')
        .notNull()
        .references(() => module.id),
    sessionType: sessionTypeEnum('session_type').notNull().default('teach'),
    // Current position
    currentSubTaskId: integer('current_sub_task_id')
        .references(() => moduleSubTask.id),
    currentTaskIndex: integer('current_task_index').default(0),
    // Session state (temporary storage)
    agentMemory: jsonb('agent_memory').$type<{
        recentResponses: number[]; // IDs of taskBlockResponse records

        strugglingConcepts: Array<{
            concept: string;
            mistakeCount: number;
        }>;
        masteredConcepts: Array<{
            concept: string;
            confidenceLevel: 'low' | 'medium' | 'high';
        }>;
        questionHistory: Array<{
            taskBlockId: number;
            evaluation?: string;
            feedBack?: string;
            hintHistory?: Array<{
                hintText: string;
                concept: string;
                wasEffective: boolean;
            }>;
        }>;
    }>(),
    ...timestamps
});


