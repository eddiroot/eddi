import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
import { Document } from "@langchain/core/documents";

/**
 * Metadata interface for any document being loaded.
 */
export interface LoaderMetadata {
  subjectId?: number;
  yearLevel?: number;
  source: string;
  type: string;

  // Relational IDs metadata
  learningAreaId?: number;
  outcomeId?: number;
  keyKnowledgeIds?: number[];
  keySkillIds?: number[];
  
  // Curriculum-specific metadata
  learningArea?: string;
  topic?: string;
  marks?: number;
  number?: number;
  example?: string;
  contentType?: string;

  // Internal tracking metadata
  userId?: number;
  moduleId?: number;
  sessionId?: string;
  taskBlockId?: number;

  // Quality metrics
  wasHelpful?: boolean;
  successRate?: number;
  usageCount?: number;

  [key: string]: unknown;
}

export abstract class EducationalDocumentLoader extends BaseDocumentLoader {
  protected metadata: LoaderMetadata;

  constructor(metadata: LoaderMetadata) {
    super();
    this.metadata = metadata;
  }

  protected enrichDocument(doc: Document): Document {
    return new Document({
      ...doc,
      metadata: {
        ...this.metadata,
        ...doc.metadata,
        timestamp: new Date().toISOString()
      }
    });
  }
}