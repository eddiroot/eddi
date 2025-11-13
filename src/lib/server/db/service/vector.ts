import { db } from '$lib/server/db';
import { cosineDistance, desc, eq, sql } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

export async function createRecordWithEmbedding(
    table: PgTable,
    record: Record<string, unknown>,
    embedding: number[][],
    userId?: string
) {
    await db.insert(table).values({
        ...record,
        embedding: JSON.stringify(embedding),
        embeddingMetadata: {
            usageCount: 0,
            lastUsedAt: null,
            userId: userId || null
        }
    });
}

export async function updateRecordEmbedding(
    table: PgTable & { embedding: PgColumn; id: PgColumn },
    recordId: number | string,
    embedding: number[][]
) {
   await db
       .update(table)
       .set({ embedding: JSON.stringify(embedding) })
       .where(eq(table.id, recordId));
}

export async function getRecord(table: PgTable & { embedding: PgColumn; id: PgColumn }, recordId: number | string) {
    return await db
        .select()
        .from(table)
        .where(eq(table.id, recordId))
        .limit(1)
}

export interface VectorSearchResult<T> {
  record: T;           
  distance: number;
}

export async function vectorSimilaritySearch<T>(
    table: PgTable & { embedding: PgColumn },
    queryEmbedding: number[],
    k: number,
): Promise<VectorSearchResult<T>[]> {
    // Calculate cosine distance (lower is more similar)
    const distance = sql<number>`${cosineDistance(table.embedding, JSON.stringify(queryEmbedding))}`;
    
    const results = await db
        .select({
            record: table,
            distance
        })
        .from(table)
        .orderBy(desc(distance))
        .limit(k);

    return results.map(row => ({
        record: row.record as T,
        distance: row.distance
    }));
}