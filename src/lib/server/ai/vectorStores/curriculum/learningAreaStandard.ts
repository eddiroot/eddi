import { yearLevelEnum } from "$lib/enums";
import { learningAreaStandard, type LearningAreaStandard } from "$lib/server/db/schema";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class LearningAreaStandardVectorStore extends TableVectorStore<LearningAreaStandard> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: learningAreaStandard,
      embeddings,
      toDocument: learningAreaStandardToDocument,
      fromDocument: documentToLearningAreaStandard
    });
  }
}

export const learningAreaStandardToDocument = (record: LearningAreaStandard): Document => {
  const content = `${record.name} (Year Level: ${record.yearLevel})\n\n${record.description || ''}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      learningAreaId: record.learningAreaId,
      name: record.name,
      yearLevel: record.yearLevel,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToLearningAreaStandard = (doc: Document): Partial<LearningAreaStandard> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract name, year level, and description
  const lines = doc.pageContent.split('\n\n');
  const firstLine = lines[0] || '';
  const match = firstLine.match(/^(.+?)\s*\(Year Level:\s*(.+?)\)$/);
  
  const name = match ? match[1].trim() : firstLine;
  const yearLevel = match ? match[2].trim() : metadata.yearLevel;
  const description = lines[1] || undefined;
  
  return {
    learningAreaId: metadata.learningAreaId as number,
    name,
    yearLevel: yearLevel as yearLevelEnum,
    description
  };
};
