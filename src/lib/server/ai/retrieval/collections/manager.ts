import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import type { Where } from "chromadb";
import { ChromaClient } from "chromadb";
import { NomicEmbeddings } from "../embeddings/nomic-embeddings";

export interface CollectionIdentifier {
  type: string;
  subjectId?: number;
  yearLevel?: number;
}

export class ChromaCollectionManager {
  private client: ChromaClient;
  private embeddings: Embeddings;
  private collections: Map<string, Chroma> = new Map();
  private chromaUrl: string;

  constructor(
    chromaUrl: string,
  ) {
    this.chromaUrl = chromaUrl;
    this.client = new ChromaClient({ path: chromaUrl });
    this.embeddings = new NomicEmbeddings();
  }

  /**
   * Generate collection name with subject and year level
   */
  private getCollectionName(identifier: CollectionIdentifier): string {
    const parts = [identifier.type];
    if (identifier.subjectId) parts.push(`sub_${identifier.subjectId}`);
    if (identifier.yearLevel) parts.push(`yr_${identifier.yearLevel}`);
    return parts.join('_');
  }

  /**
   * Get or create a collection
   */
  async getCollection(identifier: CollectionIdentifier): Promise<Chroma> {
    const name = this.getCollectionName(identifier);
    
    if (this.collections.has(name)) {
      return this.collections.get(name)!;
    }

    const collection = await Chroma.fromExistingCollection(
      this.embeddings,
      {
        url: this.chromaUrl,
        collectionName: name,
      }
    ).catch(async () => {
      // Collection doesn't exist, create it
      return new Chroma(
        this.embeddings,
        {
          url: this.chromaUrl,
          collectionName: name,
          collectionMetadata: {
            type: identifier.type,
            createdAt: new Date().toISOString()
          }
        }
      );
    });

    this.collections.set(name, collection);
    return collection;
  }

  /**
   * Add documents to a collection
   */
  async addDocuments(
    identifier: CollectionIdentifier,
    documents: Document[],
    ids?: string[]
  ): Promise<string[]> {
    const collection = await this.getCollection(identifier);
    return await collection.addDocuments(documents, { ids });
  }

  /**
   * Query a single collection
   */
  async queryCollection(
    identifier: CollectionIdentifier,
    query: string,
    k: number = 5,
    filter?: Where
  ): Promise<Document[]> {
    const collection = await this.getCollection(identifier);
    return await collection.similaritySearch(query, k, filter);
  }

  /**
   * Query multiple collections
   */
  async queryMultipleCollections(
    identifiers: CollectionIdentifier[],
    query: string,
    k: number = 5,
    filter?: Where
  ): Promise<Array<{ collection: string; documents: Document[] }>> {
    const results = await Promise.all(
      identifiers.map(async (id) => ({
        collection: this.getCollectionName(id),
        documents: await this.queryCollection(id, query, k, filter)
      }))
    );
    return results;
  }

  /**
   * List all collections matching criteria
   */
  async listCollections(
    type?: string,
    subjectId?: number,
    yearLevel?: number
  ): Promise<string[]> {
    const allCollections = await this.client.listCollections();
    
    return allCollections
      .map(c => c.name)
      .filter(name => {
        if (type && !name.startsWith(type)) return false;
        if (subjectId && !name.includes(`sub_${subjectId}`)) return false;
        if (yearLevel && !name.includes(`yr_${yearLevel}`)) return false;
        return true;
      });
  }

  /**
   * Delete a collection
   */
  async deleteCollection(identifier: CollectionIdentifier): Promise<void> {
    const name = this.getCollectionName(identifier);
    await this.client.deleteCollection({ name });
    this.collections.delete(name);
  }
}