import type { collectionTypeEnum, difficultyLevelEnum, subjectGroupEnum, yearLevelEnum } from '$lib/enums';
import { index, integer, jsonb, pgEnum, pgTable, text, vector } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';

export const collectionTypeEnumPg = pgEnum('collection_type', ['public', 'private', 'shared']);

export const contentTypeEnumPg = pgEnum('content_type', [
    'resource',
    'question_bank',
    'scaffold',
    'activities',
    'rubric_criteria',
    'feedback',
    'guidance',
    'misconception',
    'student_artifact',
    'temp_workspace'
]);

export const vectorCollections = pgTable('vector_collections', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    name: text('name').notNull(),
    type: collectionTypeEnumPg('type').notNull(),
    content_type: contentTypeEnumPg('content_type').notNull(),
    dimensions: integer('dimensions').notNull().default(768),
});

export const vectorEmbeddings = pgTable('vector_embeddings', 
    {
        id: integer('id').primaryKey(), // UUID for LangChain compatibility
        collection_id: integer('collection_id').references(() => vectorCollections.id),
        embedding: vector('embedding', { dimensions: 768 }).notNull(),
        content: text('content').notNull(),

        // Comprehensive metadata fields
        metadata: jsonb('metadata').$type<{
            type?: collectionTypeEnum
            // Internal identifiers
            userId?: string
            subjectId?: number
            courseMapItemId?: number
            taskId?: number
            sectionId?: number
            taskBlockId?: number
            // Descriptive attributes
            yearLevel?: yearLevelEnum
            subjectGroup?: subjectGroupEnum
            difficultyLevel?: difficultyLevelEnum
            qualityScore?: number
            usageCount?: number
            lastUsedAt?: string
            // Curriculum level identifiers
            keyKnowledgeId?: number
            keySkillId?: number
            learningAreaId?: number
            learningStandardId?: number
            standardElaborationId?: number
        }>(),

        ...timestamps,
    },
    (table) => [
        index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
        index('collection_idx').on(table.collection_id),
        index('metadata_idx').using('gin', table.metadata),
    ]
);

export type VectorCollection = typeof vectorCollections.$inferSelect;
export type VectorEmbedding = typeof vectorEmbeddings.$inferSelect;