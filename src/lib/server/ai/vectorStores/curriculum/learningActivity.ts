import { yearLevelEnum } from "$lib/enums";
import { learningActivity, type LearningActivity } from "$lib/server/db/schema";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getLearningActivityMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class LearningActivityVectorStore extends TableVectorStore<LearningActivity> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: learningActivity,
      embeddings,
      toDocument: learningActivityToDocument,
      fromDocument: documentToLearningActivity,
      extractMetadata: extractLearningActivityMetadata
    });
  }
}

export const extractLearningActivityMetadata = async (
  record: Partial<LearningActivity>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.curriculumSubjectId) {
    return {
      yearLevel: record.yearLevel
    };
  }

  try {
    const metadata = await getLearningActivityMetadataByCurriculumSubjectId(record.curriculumSubjectId);
    
    return {
      ...metadata,
      yearLevel: record.yearLevel
    };
  } catch (error) {
    console.error('Error extracting learning activity metadata:', error);
    return {
      curriculumSubjectId: record.curriculumSubjectId,
      yearLevel: record.yearLevel
    };
  }
};

export const learningActivityToDocument = (record: LearningActivity): Document => {
  const content = `Learning Activity (Year Level: ${record.yearLevel}):\n${record.content}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      curriculumSubjectId: record.curriculumSubjectId,
      yearLevel: record.yearLevel,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToLearningActivity = (doc: Document): Partial<LearningActivity> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract year level and content
  const match = doc.pageContent.match(/Learning Activity\s*\(Year Level:\s*(.+?)\):\s*(.+)/s);
  const yearLevel = match ? match[1].trim() : metadata.yearLevel;
  const content = match ? match[2].trim() : doc.pageContent;
  
  return {
    curriculumSubjectId: metadata.curriculumSubjectId as number,
    yearLevel: yearLevel as yearLevelEnum,
    content
  };
};
