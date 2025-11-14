import { subjectThreadTypeEnum } from "$lib/enums";
import { subjectThread, type SubjectThread } from "$lib/server/db/schema";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class SubjectThreadVectorStore extends TableVectorStore<SubjectThread> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: subjectThread,
      embeddings,
      toDocument: subjectThreadToDocument,
      fromDocument: documentToSubjectThread
    });
  }
}

export const subjectThreadToDocument = (record: SubjectThread): Document => {
  const content = `${record.title}\n\nType: ${record.type}\n\n${record.content}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      type: record.type,
      subjectOfferingId: record.subjectOfferingId,
      userId: record.userId,
      title: record.title,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToSubjectThread = (doc: Document): Partial<SubjectThread> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract title, type, and content
  const lines = doc.pageContent.split('\n\n');
  const title = lines[0] || '';
  
  const typeMatch = lines[1]?.match(/Type:\s*(.+)/);
  const type = typeMatch ? typeMatch[1].trim() : metadata.type;
  
  const content = lines[2] || '';
  
  return {
    type: type as subjectThreadTypeEnum,
    subjectOfferingId: metadata.subjectOfferingId as number,
    userId: metadata.userId as string,
    title,
    content
  };
};
