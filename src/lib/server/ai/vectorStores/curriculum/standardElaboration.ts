import { standardElaboration, type StandardElaboration } from "$lib/server/db/schema";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class StandardElaborationVectorStore extends TableVectorStore<StandardElaboration> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: standardElaboration,
      embeddings,
      toDocument: standardElaborationToDocument,
      fromDocument: documentToStandardElaboration
    });
  }
}

export const standardElaborationToDocument = (record: StandardElaboration): Document => {
  const content = `${record.name}\n\n${record.standardElaboration}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      learningAreaStandardId: record.learningAreaStandardId,
      name: record.name,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToStandardElaboration = (doc: Document): Partial<StandardElaboration> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract name and elaboration
  const lines = doc.pageContent.split('\n\n');
  const name = lines[0] || '';
  const standardElaboration = lines[1] || '';
  
  return {
    learningAreaStandardId: metadata.learningAreaStandardId as number,
    name,
    standardElaboration
  };
};
