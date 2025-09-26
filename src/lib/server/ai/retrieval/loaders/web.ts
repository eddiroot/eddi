import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";
import { EducationalDocumentLoader, type LoaderMetadata } from "./base";

export class EducationalWebLoader extends EducationalDocumentLoader {
  private url: string;
  private selector?: string;

  constructor(url: string, metadata: LoaderMetadata, selector?: string) {
    super(metadata);
    this.url = url;
    this.selector = selector;
  }

  async load(): Promise<Document[]> {
    const loader = new CheerioWebBaseLoader(this.url, {
      selector: this.selector
    });
    
    const docs = await loader.load();
    return docs.map(doc => this.enrichDocument(doc));
  }
}