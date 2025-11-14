import { learningArea, type LearningArea } from "$lib/server/db/schema";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getLearningAreaMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class LearningAreaVectorStore extends TableVectorStore<LearningArea> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: learningArea,
      embeddings,
      toDocument: learningAreaToDocument,
      fromDocument: documentToLearningArea,
      extractMetadata: extractLearningAreaMetadata
    });
  }
}

export const extractLearningAreaMetadata = async (
  record: Partial<LearningArea>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.curriculumSubjectId) {
    return {};
  }

  try {
    const metadata = await getLearningAreaMetadataByCurriculumSubjectId(record.curriculumSubjectId);
    
    return {
      ...metadata,
      name: record.name,
      abbreviation: record.abbreviation
    };
  } catch (error) {
    console.error('Error extracting learning area metadata:', error);
    return {
      curriculumSubjectId: record.curriculumSubjectId
    };
  }
};

export const learningAreaToDocument = (record: LearningArea): Document => {
  const content = `${record.name}${record.abbreviation ? ` (${record.abbreviation})` : ''}\n\n${record.description || ''}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      curriculumSubjectId: record.curriculumSubjectId,
      name: record.name,
      abbreviation: record.abbreviation,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToLearningArea = (doc: Document): Partial<LearningArea> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract name, abbreviation, and description
  const lines = doc.pageContent.split('\n\n');
  const firstLine = lines[0] || '';
  const abbrMatch = firstLine.match(/^(.+?)\s*\((.+?)\)$/);
  
  const name = abbrMatch ? abbrMatch[1].trim() : firstLine;
  const abbreviation = abbrMatch ? abbrMatch[2].trim() : undefined;
  const description = lines[1] || undefined;
  
  return {
    curriculumSubjectId: metadata.curriculumSubjectId as number,
    name,
    abbreviation,
    description
  };
};
