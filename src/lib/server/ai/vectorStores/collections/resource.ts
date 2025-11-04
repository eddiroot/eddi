import { pool } from "$lib/server/db";
import type { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import type { Document } from "@langchain/core/documents";
import { contentTypeEnum } from "../../../../enums";
import { createVectorStore } from "../base";
import type { VectorMetadata } from "../loaders/base";



export class ResourceVectorStore {
  private static instance: ResourceVectorStore;
  private vectorStore: PGVectorStore | null = null;

  private constructor() {}

  static getInstance(): ResourceVectorStore {
    if (!ResourceVectorStore.instance) {
      ResourceVectorStore.instance = new ResourceVectorStore();
    }
    return ResourceVectorStore.instance;
  }

  private async getVectorStore(): Promise<PGVectorStore> {
    if (!this.vectorStore) {
      this.vectorStore = await createVectorStore({
        collectionName: contentTypeEnum.resource
      });
    }
    return this.vectorStore;
  }

  async addQuestion(
    content: string,
    metadata: VectorMetadata
  ): Promise<void> {
    const vectorStore = await this.getVectorStore();

    const doc: Document = {
      pageContent: content,
      metadata: {
        ...metadata,
        lastUsedAt: new Date().toISOString(),
      }
    };

    await vectorStore.addDocuments([doc]);
  }

  async addQuestions(
    questions: Array<{ content: string; metadata: VectorMetadata }>
  ): Promise<void> {
    const vectorStore = await this.getVectorStore();

    const docs = questions.map(q => ({
      pageContent: q.content,
      metadata: {
        ...q.metadata,
        lastUsedAt: new Date().toISOString(),
      }
    }));

    await vectorStore.addDocuments(docs);
  }

  async findSimilar(
    query: string,
    filters: Partial<VectorMetadata> = {},
    limit: number = 5
  ): Promise<Document[]> {
    const vectorStore = await this.getVectorStore();
    return await vectorStore.similaritySearch(query, limit, filters);
  }

  async findSimilarWithScores(
    query: string,
    filters: Partial<VectorMetadata> = {},
    limit: number = 5
  ): Promise<Array<[Document, number]>> {
    const vectorStore = await this.getVectorStore();
    return await vectorStore.similaritySearchWithScore(query, limit, filters);
  }

  async incrementUsageCount(questionId: number): Promise<void> {
    await pool.query(`
      UPDATE vector_embeddings
      SET metadata = jsonb_set(
        metadata,
        '{usageCount}',
        (COALESCE((metadata->>'usageCount')::int, 0) + 1)::text::jsonb
      ),
      updated_at = NOW()
      WHERE id = $1
    `, [questionId]);
  }

  clearCache(): void {
    this.vectorStore = null;
  }
}

export const resourceVectorStore = ResourceVectorStore.getInstance();