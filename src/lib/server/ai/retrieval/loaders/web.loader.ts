import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { NomicEmbeddings } from "../embeddings/nomic-embeddings";
import { ChromaVectorStore } from "../vectorstores/chroma.store";
import { BaseLoader } from "./base.loader";

export interface WebLoaderConfig {
  urls: string | string[];
  selector?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  storeInMemory?: boolean;
  metadata?: Record<string, unknown>;
  webOptions?: {
    timeout?: number;
    requestConfig?: Record<string, unknown>;
  };
}

/**
 * Web Loader that processes web pages and optionally stores them in memory vector store
 * 
 * Usage:
 * - Load single URL: new WebLoader({ urls: "https://example.com" })
 * - Load multiple URLs: new WebLoader({ urls: ["https://example1.com", "https://example2.com"] })
 * - Use CSS selector: new WebLoader({ urls: "...", selector: ".main-content" })
 * - Store in memory: new WebLoader({ urls: "...", storeInMemory: true })
 */
export class WebLoader extends BaseLoader {
  private urls: string[];
  private selector?: string;
  private chunkSize: number;
  private chunkOverlap: number;
  private storeInMemory: boolean;
  private webOptions?: {
    timeout?: number;
    requestConfig?: Record<string, unknown>;
  };

  constructor(config: WebLoaderConfig) {
    super({
      source: Array.isArray(config.urls) ? config.urls.join(', ') : config.urls,
      metadata: config.metadata
    });
    
    this.urls = Array.isArray(config.urls) ? config.urls : [config.urls];
    this.selector = config.selector;
    this.chunkSize = config.chunkSize || 1000;
    this.chunkOverlap = config.chunkOverlap || 200;
    this.storeInMemory = config.storeInMemory || false;
    this.webOptions = config.webOptions;

    if (this.urls.length === 0) {
      throw new Error("At least one URL must be provided");
    }
  }

  async load(): Promise<Document[]> {
    try {
      console.log(`🌐 Loading web pages: ${this.urls.length} URLs`);

      const allDocs: Document[] = [];

      for (const url of this.urls) {
        console.log(`📄 Loading: ${url}`);

        // Create CheerioWebBaseLoader for this URL
        const loaderConfig: Record<string, unknown> = {};
        
        if (this.selector) {
          loaderConfig.selector = this.selector;
        }

        if (this.webOptions?.timeout) {
          loaderConfig.timeout = this.webOptions.timeout;
        }

        if (this.webOptions?.requestConfig) {
          loaderConfig.requestConfig = this.webOptions.requestConfig;
        }

        const loader = new CheerioWebBaseLoader(url, loaderConfig);
        const docs = await loader.load();

        console.log(`📄 Loaded ${docs.length} documents from ${url}`);
        allDocs.push(...docs);
      }

      // Split documents into chunks if they're large
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: this.chunkSize,
        chunkOverlap: this.chunkOverlap,
        separators: ['\n\n', '\n', '.', '!', '?', ';', ':', ' ', '']
      });

      const splitDocs = await textSplitter.splitDocuments(allDocs);
      console.log(`🌐 Split into ${splitDocs.length} chunks`);

      // Add metadata to each chunk
      const enrichedDocs = splitDocs.map((doc, index) => 
        this.createDocument(doc.pageContent, {
          ...doc.metadata,
          chunkIndex: index,
          totalChunks: splitDocs.length,
          chunkSize: this.chunkSize,
          type: 'web_chunk',
          selector: this.selector,
          loadedUrls: this.urls.length
        })
      );

      // Optionally store in memory vector store
      if (this.storeInMemory) {
        await this.storeInMemoryVectorStore(enrichedDocs);
      }

      return enrichedDocs;
    } catch (error) {
      console.error('❌ Failed to load web pages:', error);
      throw error;
    }
  }

  private async storeInMemoryVectorStore(documents: Document[]): Promise<void> {
    try {
      console.log('💾 Storing web content chunks in memory vector store...');
      
      const embeddings = new NomicEmbeddings();
      const memoryStore = await ChromaVectorStore.fromDocuments(documents, embeddings, { collectionName: 'memory' });
      
      console.log(`✅ Stored ${documents.length} chunks in memory vector store`);
      
      // Store reference to the memory store for later retrieval
      this.setMemoryStore(memoryStore);
    } catch (error) {
      console.error('❌ Failed to store in memory vector store:', error);
      throw error;
    }
  }

  private memoryStore?: ChromaVectorStore;

  private setMemoryStore(store: ChromaVectorStore): void {
    this.memoryStore = store;
  }

  /**
   * Get the memory vector store if documents were stored
   */
  getMemoryStore(): ChromaVectorStore | undefined {
    return this.memoryStore;
  }

  /**
   * Search within the loaded web content using the memory store
   */
  async searchInContent(query: string, k: number = 5): Promise<Document[]> {
    if (!this.memoryStore) {
      throw new Error("Web content not stored in memory. Set storeInMemory: true when loading");
    }
    
    return await this.memoryStore.similaritySearch(query, k);
  }

  /**
   * Create a web loader that automatically stores in memory
   */
  static async createWithMemoryStore(config: Omit<WebLoaderConfig, 'storeInMemory'>): Promise<WebLoader> {
    const loader = new WebLoader({
      ...config,
      storeInMemory: true
    });
    
    await loader.load();
    return loader;
  }

  /**
   * Load a single URL with default settings
   */
  static async loadUrl(url: string, storeInMemory: boolean = false): Promise<Document[]> {
    const loader = new WebLoader({
      urls: url,
      storeInMemory
    });
    
    return await loader.load();
  }

  /**
   * Load multiple URLs with default settings
   */
  static async loadUrls(urls: string[], storeInMemory: boolean = false): Promise<Document[]> {
    const loader = new WebLoader({
      urls,
      storeInMemory
    });
    
    return await loader.load();
  }
}