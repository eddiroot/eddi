import { Document } from "@langchain/core/documents";

export interface LoaderConfig {
  source: string;
  metadata?: Record<string, unknown>;
}

export abstract class BaseLoader {
  protected config: LoaderConfig;

  constructor(config: LoaderConfig) {
    this.config = config;
  }

  abstract load(): Promise<Document[]>;

  protected createDocument(content: string, metadata?: Record<string, unknown>): Document {
    return new Document({
      pageContent: content,
      metadata: {
        source: this.config.source,
        ...this.config.metadata,
        ...metadata,
        loadedAt: new Date().toISOString()
      }
    });
  }
}