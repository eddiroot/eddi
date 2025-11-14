import { keyKnowledge, type KeyKnowledge } from "$lib/server/db/schema";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class KeyKnowledgeVectorStore extends TableVectorStore<KeyKnowledge> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: keyKnowledge,
      embeddings,
      toDocument: keyKnowledgeToDocument,
      fromDocument: documentToKeyKnowledge
    });
  }
}

export const keyKnowledgeToDocument = (record: KeyKnowledge): Document => {
  const topicPart = record.topicName ? `\nTopic: ${record.topicName}` : '';
  const content = `Key Knowledge ${record.number}: ${record.description}${topicPart}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      outcomeId: record.outcomeId,
      curriculumSubjectId: record.curriculumSubjectId,
      number: record.number,
      topicName: record.topicName,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToKeyKnowledge = (doc: Document): Partial<KeyKnowledge> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract number, description, and topic
  const match = doc.pageContent.match(/Key Knowledge\s+(\d+):\s*(.+?)(?:\nTopic:\s*(.+))?$/s);
  const number = match ? parseInt(match[1], 10) : 1;
  const description = match ? match[2].trim() : doc.pageContent;
  const topicName = match && match[3] ? match[3].trim() : undefined;
  
  return {
    outcomeId: metadata.outcomeId as number | undefined,
    curriculumSubjectId: metadata.curriculumSubjectId as number | undefined,
    number,
    description,
    topicName
  };
};
