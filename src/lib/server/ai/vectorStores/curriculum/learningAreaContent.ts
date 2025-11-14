import { learningAreaContent, type LearningAreaContent } from "$lib/server/db/schema";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getLearningAreaContentMetadataByLearningAreaId } from "$lib/server/db/service/curriculum";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class LearningAreaContentVectorStore extends TableVectorStore<LearningAreaContent> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: learningAreaContent,
      embeddings,
      toDocument: learningAreaContentToDocument,
      fromDocument: documentToLearningAreaContent,
      extractMetadata: extractLearningAreaContentMetadata
    });
  }
}

export const extractLearningAreaContentMetadata = async (
  record: Partial<LearningAreaContent>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.learningAreaId) {
    return {
      number: record.number
    };
  }

  try {
    const metadata = await getLearningAreaContentMetadataByLearningAreaId(record.learningAreaId);
    
    return {
      ...metadata,
      number: record.number
    };
  } catch (error) {
    console.error('Error extracting learning area content metadata:', error);
    return {
      learningAreaId: record.learningAreaId,
      number: record.number
    };
  }
};

export const learningAreaContentToDocument = (record: LearningAreaContent): Document => {
  const content = `Content ${record.number}: ${record.description}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      learningAreaId: record.learningAreaId,
      number: record.number,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToLearningAreaContent = (doc: Document): Partial<LearningAreaContent> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract number and description
  const match = doc.pageContent.match(/Content\s+(\d+):\s*(.+)/s);
  const number = match ? parseInt(match[1], 10) : 1;
  const description = match ? match[2].trim() : doc.pageContent;
  
  return {
    learningAreaId: metadata.learningAreaId as number,
    number,
    description
  };
};
