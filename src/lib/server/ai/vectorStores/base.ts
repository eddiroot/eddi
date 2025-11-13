import { createRecordWithEmbedding, getRecord, updateRecordEmbedding, vectorSimilaritySearch } from "$lib/server/db/service";
import type { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

/**
 * Type for converting a record to a Document
 */
export type RecordToDocument<T> = (record: T) => Document;

/**
 * Type for converting a Document to a record
 */
export type DocumentToRecord<T> = (doc: Document) => Partial<T>;

/**
 * Default implementation of RecordToDocument using a content extractor,
 * combini
 */
export interface TableVectorStoreConfig<T extends Record<string, unknown>> {
  table: PgTable & { embedding: PgColumn; id: PgColumn };
  embeddings: EmbeddingsInterface;
  
  // Required converters
  toDocument: RecordToDocument<T>;
  fromDocument: DocumentToRecord<T>;
}

export abstract class TableVectorStore<T extends Record<string, unknown>> extends VectorStore {
  protected table: PgTable & { embedding: PgColumn; id: PgColumn };
  protected config: TableVectorStoreConfig<T>;

  _vectorstoreType(): string {
    return "table_vector_store";
  }

  constructor(config: TableVectorStoreConfig<T>) {
    super(config.embeddings, {});
    this.table = config.table;
    this.config = config;
  }

  // Required by VectorStore: add vectors with documents
  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    if (vectors.length !== documents.length) {
      throw new Error("Vectors and documents must have the same length");
    }

    for (let i = 0; i < vectors.length; i++) {
      const doc = documents[i];
      const record = this.config.fromDocument(doc);
      await createRecordWithEmbedding(this.table, record, [vectors[i]]);
    }
  }

  // Required by VectorStore: similarity search with scores
  async similaritySearchVectorWithScore(
    query: number[],
    k: number
  ): Promise<[Document, number][]> {
    const results = await vectorSimilaritySearch(this.table, query, k);
    return results.map(result => [
      this.config.toDocument(result.record as T),
      result.distance
    ]);
  }

  async addDocuments(docs: Document[]): Promise<void> {
    for (const doc of docs) {
      const record = this.config.fromDocument(doc);
      const embedding = await this.embeddings.embedDocuments([doc.pageContent]);
      // Insert into DB
      await createRecordWithEmbedding(this.table, record, embedding);
    }
  }

  // Get top k similar documents with similarity scores
  async searchWithScores(queryEmbedding: number[], k: number): Promise<[Document, number][]> {
    const results = await vectorSimilaritySearch(this.table, queryEmbedding, k);
    return results.map(result => [this.config.toDocument(result.record as T), result.distance]);
  }

  // Get top k similar documents
  async similaritySearchAsDocuments(query: string, k: number): Promise<Document[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    const results = await vectorSimilaritySearch(this.table, queryEmbedding, k);
    return results.map(result => this.config.toDocument(result.record as T));
  }

  // Get top k similar records
  async similaritySearchAsRecords(query: string, k: number): Promise<T[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    const results = await vectorSimilaritySearch(this.table, queryEmbedding, k);
    return results.map(result => result.record as T);
  }

  // Update the embedding of a record by its ID
  async updateEmbedding(recordId: number | string): Promise<void> {
    const record = await getRecord(this.table, recordId);
    const doc = this.config.toDocument(record as unknown as T);
    const recordEmbedding = await this.embeddings.embedDocuments([doc.pageContent]);
    await updateRecordEmbedding(this.table, recordId, recordEmbedding);
  }
}