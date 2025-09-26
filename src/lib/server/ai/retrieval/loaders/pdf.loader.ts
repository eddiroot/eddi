import { PDFLoader as LangChainPDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { NomicEmbeddings } from "../embeddings/nomic-embeddings";
import { ChromaVectorStore } from "../vectorstores/chroma.store";
import { BaseLoader } from "./base.loader";

export interface PDFLoaderConfig {
  filePath?: string;
  fileBuffer?: Buffer;
  chunkSize?: number;
  chunkOverlap?: number;
  storeInMemory?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * PDF Loader that processes PDF files and optionally stores them in memory vector store
 * 
 * Usage:
 * - Load from file path: new PDFLoader({ filePath: "/path/to/file.pdf" })
 * - Load from buffer: new PDFLoader({ fileBuffer: buffer })
 * - Store in memory: new PDFLoader({ filePath: "...", storeInMemory: true })
 */
export class PDFLoader extends BaseLoader {
  private chunkSize: number;
  private chunkOverlap: number;
  private storeInMemory: boolean;
  private filePath?: string;
  private fileBuffer?: Buffer;

  constructor(config: PDFLoaderConfig) {
    super({
      source: config.filePath || "pdf_buffer",
      metadata: config.metadata
    });
    
    this.chunkSize = config.chunkSize || 1000;
    this.chunkOverlap = config.chunkOverlap || 200;
    this.storeInMemory = config.storeInMemory || false;
    this.filePath = config.filePath;
    this.fileBuffer = config.fileBuffer;

    if (!this.filePath && !this.fileBuffer) {
      throw new Error("Either filePath or fileBuffer must be provided");
    }
  }

  async load(): Promise<Document[]> {
    try {
      console.log(`📄 Loading PDF: ${this.filePath || 'from buffer'}`);

      // Load PDF using LangChain's PDFLoader
      let loader: LangChainPDFLoader;
      
      if (this.filePath) {
        loader = new LangChainPDFLoader(this.filePath);
      } else if (this.fileBuffer) {
        // Create a temporary file for the buffer
        const fs = await import('fs/promises');
        const path = await import('path');
        const os = await import('os');
        
        const tempPath = path.join(os.tmpdir(), `temp_pdf_${Date.now()}.pdf`);
        await fs.writeFile(tempPath, this.fileBuffer);
        loader = new LangChainPDFLoader(tempPath);
        
        // Clean up temp file after loading
        process.on('exit', () => {
          fs.unlink(tempPath).catch(console.error);
        });
      } else {
        throw new Error("No PDF source provided");
      }

      const docs = await loader.load();
      console.log(`📄 Loaded ${docs.length} pages from PDF`);

      // Split documents into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: this.chunkSize,
        chunkOverlap: this.chunkOverlap,
        separators: ['\n\n', '\n', '.', '!', '?', ';', ':', ' ', '']
      });

      const splitDocs = await textSplitter.splitDocuments(docs);
      console.log(`📄 Split into ${splitDocs.length} chunks`);

      // Add metadata to each chunk
      const enrichedDocs = splitDocs.map((doc, index) => 
        this.createDocument(doc.pageContent, {
          ...doc.metadata,
          chunkIndex: index,
          totalChunks: splitDocs.length,
          chunkSize: this.chunkSize,
          type: 'pdf_chunk',
          originalSource: this.filePath || 'uploaded_buffer'
        })
      );

      // Optionally store in memory vector store
      if (this.storeInMemory) {
        await this.storeInMemoryVectorStore(enrichedDocs);
      }

      return enrichedDocs;
    } catch (error) {
      console.error('❌ Failed to load PDF:', error);
      throw error;
    }
  }

  private async storeInMemoryVectorStore(documents: Document[]): Promise<void> {
    try {
      console.log('💾 Storing PDF chunks in memory vector store...');
      
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
   * Search within the loaded PDF using the memory store
   */
  async searchInPDF(query: string, k: number = 5): Promise<Document[]> {
    if (!this.memoryStore) {
      throw new Error("PDF not stored in memory. Set storeInMemory: true when loading");
    }
    
    return await this.memoryStore.similaritySearch(query, k);
  }

  /**
   * Create a PDF loader that automatically stores in memory
   */
  static async createWithMemoryStore(config: Omit<PDFLoaderConfig, 'storeInMemory'>): Promise<PDFLoader> {
    const loader = new PDFLoader({
      ...config,
      storeInMemory: true
    });
    
    await loader.load();
    return loader;
  }
}