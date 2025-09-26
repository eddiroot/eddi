import { Document } from "@langchain/core/documents";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { EducationalDocumentLoader, type LoaderMetadata } from "./base";

export class EducationalJSONLoader extends EducationalDocumentLoader {
  private filePath: string;
  private jsonPointer?: string;

  constructor(
    filePath: string,
    metadata: LoaderMetadata,
    jsonPointer?: string
  ) {
    super(metadata);
    this.filePath = filePath;
    this.jsonPointer = jsonPointer;
  }

  async load(): Promise<Document[]> {
    const loader = new JSONLoader(
      this.filePath,
      this.jsonPointer
    );
    
    const docs = await loader.load();
    return docs.map(doc => this.enrichDocument(doc));
  }
}