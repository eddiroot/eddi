import { yearLevelEnum } from "$lib/enums";
import { assessmentTask, type AssessmentTask } from "$lib/server/db/schema";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class AssessmentTaskVectorStore extends TableVectorStore<AssessmentTask> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: assessmentTask,
      embeddings,
      toDocument: assessmentTaskToDocument,
      fromDocument: documentToAssessmentTask
    });
  }
}

export const assessmentTaskToDocument = (record: AssessmentTask): Document => {
  const content = `Assessment Task (Year Level: ${record.yearLevel}):\n${record.content}`;
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

export const documentToAssessmentTask = (doc: Document): Partial<AssessmentTask> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract year level and content
  const match = doc.pageContent.match(/Assessment Task\s*\(Year Level:\s*(.+?)\):\s*(.+)/s);
  const yearLevel = match ? match[1].trim() : metadata.yearLevel;
  const content = match ? match[2].trim() : doc.pageContent;
  
  return {
    curriculumSubjectId: metadata.curriculumSubjectId as number,
    yearLevel: yearLevel as yearLevelEnum,
    content
  };
};
