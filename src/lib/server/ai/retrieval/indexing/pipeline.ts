import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChromaCollectionManager } from "../collections/manager";
import { EducationalJSONLoader } from "../loaders/json";
import { EducationalPDFLoader } from "../loaders/pdf";
import { EducationalWebLoader } from "../loaders/web";

export class IndexingPipeline {
  private manager: ChromaCollectionManager;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(manager: ChromaCollectionManager) {
    this.manager = manager;
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
  }

  /**
   * Index web content
   */
  async indexWebContent(
    url: string,
    collectionType: string,
    subjectId: number,
    yearLevel?: number
  ) {
    const loader = new EducationalWebLoader(
      url,
      {
        source: url,
        type: 'web',
        subjectId,
        yearLevel
      }
    );

    const docs = await loader.load();
    const splitDocs = await this.textSplitter.splitDocuments(docs);
    
    await this.manager.addDocuments(
      { type: collectionType, subjectId, yearLevel },
      splitDocs
    );

    return splitDocs.length;
  }

  /**
   * Index PDF content
   */
  async indexPDFContent(
    filePath: string,
    collectionType: string,
    subjectId: number,
    yearLevel?: number
  ) {
    const loader = new EducationalPDFLoader(
      filePath,
      {
        source: filePath,
        type: 'pdf',
        subjectId,
        yearLevel
      }
    );

    const docs = await loader.load();
    const splitDocs = await this.textSplitter.splitDocuments(docs);
    
    await this.manager.addDocuments(
      { type: collectionType, subjectId, yearLevel },
      splitDocs
    );

    return splitDocs.length;
  }

  /**
   * Index JSON curriculum data
   */
  async indexJSONContent(
    filePath: string,
    collectionType: string,
    subjectId: number,
    yearLevel?: number,
    jsonPointer?: string
  ) {
    const loader = new EducationalJSONLoader(
      filePath,
      {
        source: filePath,
        type: 'json',
        subjectId,
        yearLevel
      },
      jsonPointer
    );

    const docs = await loader.load();
    
    await this.manager.addDocuments(
      { type: collectionType, subjectId, yearLevel },
      docs
    );

    return docs.length;
  }

  /**
   * Batch index multiple documents
   */
  async batchIndex(
    documents: Document[],
    collectionType: string,
    subjectId: number,
    yearLevel?: number,
    batchSize: number = 100
  ) {
    const splitDocs = await this.textSplitter.splitDocuments(documents);
    
    for (let i = 0; i < splitDocs.length; i += batchSize) {
      const batch = splitDocs.slice(i, i + batchSize);
      await this.manager.addDocuments(
        { type: collectionType, subjectId, yearLevel },
        batch
      );
    }

    return splitDocs.length;
  }
}