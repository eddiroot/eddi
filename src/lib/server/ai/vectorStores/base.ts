import { createRecordWithEmbedding, getRecord, updateRecordEmbedding, vectorSimilaritySearch } from "$lib/server/db/service";
import type { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

/**
 * Type for extracting content from a record
 */
export type ContentExtractor<T> = (record: T) => string;


/**
 * Type for converting a record to a Document
 */
export type RecordToDocument<T> = (record: T) => Document;

/**
 * Type for converting a Document to a record
 */
export type DocumentToRecord<T> = (doc: Document) => Partial<T>;


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

  async addDocuments(docs: Document[]) {
    for (const doc of docs) {
        const record = this.config.fromDocument(doc);
        const embedding = await this.embeddings.embedDocuments([doc.pageContent]);
        // Insert into DB
        await createRecordWithEmbedding(
            this.table,
            record,
            embedding
        );  
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
  async updateEmbedding(recordId: number | string) {
    const record = await getRecord(this.table, recordId);
    const doc = this.config.toDocument(record as unknown as T);
    const recordEmbedding = await this.embeddings.embedDocuments([doc.pageContent]);
    await updateRecordEmbedding(this.table, recordId, recordEmbedding);
  }
}