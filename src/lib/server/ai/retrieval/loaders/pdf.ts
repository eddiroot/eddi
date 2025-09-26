import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { EducationalDocumentLoader, type LoaderMetadata } from "./base";

export class EducationalPDFLoader extends EducationalDocumentLoader {
  private filePath: string;
  private splitPages: boolean;

  constructor(
    filePath: string, 
    metadata: LoaderMetadata,
    splitPages: boolean = true
  ) {
    super(metadata);
    this.filePath = filePath;
    this.splitPages = splitPages;
  }

  async load(): Promise<Document[]> {
    const loader = new PDFLoader(this.filePath, {
      splitPages: this.splitPages
    });
    
    const docs = await loader.load();
    return docs.map(doc => this.enrichDocument(doc));
  }
}