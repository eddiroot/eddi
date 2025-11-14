import { learningAreaOutcome, type LearningAreaOutcome } from "$lib/server/db/schema";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class LearningAreaOutcomeVectorStore extends TableVectorStore<LearningAreaOutcome> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: learningAreaOutcome,
      embeddings,
      toDocument: learningAreaOutcomeToDocument,
      fromDocument: documentToLearningAreaOutcome
    });
  }
}

export const learningAreaOutcomeToDocument = (record: LearningAreaOutcome): Document => {
  const content = `Learning Area Outcome: Learning Area ID ${record.learningAreaId}, Outcome ID ${record.outcomeId}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      learningAreaId: record.learningAreaId,
      outcomeId: record.outcomeId,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToLearningAreaOutcome = (doc: Document): Partial<LearningAreaOutcome> => {
  const metadata = doc.metadata || {};
  
  return {
    learningAreaId: metadata.learningAreaId as number,
    outcomeId: metadata.outcomeId as number
  };
};
