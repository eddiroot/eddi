import type { Document } from "@langchain/core/documents";
import { contentTypeEnum } from "../../../enums";
import { pool } from "../../db";
import { defaultEmbeddings } from "../embeddings";
import type { VectorMetadata } from "./loaders/base";

export interface MultiSearchOptions {
    collections?: contentTypeEnum[];
    filters?: Partial<VectorMetadata>;
    limit?: number;
}

export class MultiCollectionVectorStore {
  private static instance: MultiCollectionVectorStore;

  private constructor() {}

  static getInstance(): MultiCollectionVectorStore {
    if (!MultiCollectionVectorStore.instance) {
      MultiCollectionVectorStore.instance = new MultiCollectionVectorStore();
    }
    return MultiCollectionVectorStore.instance;
  }

  async searchAll(
    query: string,
    options: MultiSearchOptions = {}
  ): Promise<Array<Document & { collection: string; score: number }>> {
    const { collections, filters, limit = 10 } = options;

    const queryEmbedding = await defaultEmbeddings.embedQuery(query);

    let sql = `
      SELECT 
        ve.id,
        ve.content,
        ve.metadata,
        ve.embedding <-> $1::vector AS distance,
        vc.name AS collection_name,
        vc.content_type
      FROM vector_embeddings ve
      JOIN vector_collections vc ON ve.collection_id = vc.id
      WHERE 1=1
    `;

    const params: (string | number | string[])[] = [JSON.stringify(queryEmbedding)];
    let paramIndex = 2;

    if (collections && collections.length > 0) {
      sql += ` AND vc.content_type = ANY($${paramIndex})`;
      params.push(collections);
      paramIndex++;
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          sql += ` AND ve.metadata->>'${key}' = $${paramIndex}`;
          params.push(String(value));
          paramIndex++;
        }
      });
    }

    sql += ` ORDER BY distance ASC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(sql, params);

    return result.rows.map(row => ({
      pageContent: row.content,
      metadata: row.metadata,
      collection: row.collection_name,
      score: row.distance
    }));
  }

  async searchByContentType(
    query: string,
    contentTypes: contentTypeEnum[],
    options: Omit<MultiSearchOptions, 'collections'> = {}
  ): Promise<Document[]> {
    const { filters, limit = 10 } = options;
    const queryEmbedding = await defaultEmbeddings.embedQuery(query);

    let sql = `
      SELECT 
        ve.content,
        ve.metadata,
        vc.name AS collection_name,
        vc.content_type
      FROM vector_embeddings ve
      JOIN vector_collections vc ON ve.collection_id = vc.id
      WHERE vc.content_type = ANY($1)
    `;

    const params: (string | number | contentTypeEnum[])[] = [contentTypes, JSON.stringify(queryEmbedding)];
    let paramIndex = 3;

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          sql += ` AND ve.metadata->>'${key}' = $${paramIndex}`;
          params.push(String(value));
          paramIndex++;
        }
      });
    }

    sql += ` ORDER BY ve.embedding <-> $2::vector LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(sql, params);

    return result.rows.map(row => ({
      pageContent: row.content,
      metadata: {
        ...row.metadata,
        collection: row.collection_name,
        contentType: row.content_type
      }
    }));
  }

  async hybridSearch(
    query: string,
    collections: contentTypeEnum[],
    options: Omit<MultiSearchOptions, 'collections'> = {}
  ): Promise<Document[]> {
    const { limit = 10 } = options;

    const results = await Promise.all(
      collections.map(async (collection) => {
        const docs = await this.searchAll(query, {
          ...options,
          collections: [collection],
          limit
        });

        return docs.map(doc => ({
          ...doc,
          score: doc.score
        }));
      })
    );

    return results
      .flat()
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);
  }
}

export const multiCollectionStore = MultiCollectionVectorStore.getInstance();