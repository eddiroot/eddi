import { subjectThreadResponseTypeEnum } from "$lib/enums";
import { subjectThreadResponse, type SubjectThreadResponse } from "$lib/server/db/schema";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getSubjectThreadResponseMetadataBySubjectThreadId } from "$lib/server/db/service/subjects";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class SubjectThreadResponseVectorStore extends TableVectorStore<SubjectThreadResponse> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: subjectThreadResponse,
      embeddings,
      toDocument: subjectThreadResponseToDocument,
      fromDocument: documentToSubjectThreadResponse,
      extractMetadata: extractSubjectThreadResponseMetadata
    });
  }
}

export const extractSubjectThreadResponseMetadata = async (
  record: Partial<SubjectThreadResponse>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.subjectThreadId) {
    return {
      type: record.type,
      userId: record.userId,
      parentResponseId: record.parentResponseId
    };
  }

  try {
    const metadata = await getSubjectThreadResponseMetadataBySubjectThreadId(record.subjectThreadId);
    
    return {
      ...metadata,
      type: record.type,
      userId: record.userId,
      parentResponseId: record.parentResponseId
    };
  } catch (error) {
    console.error('Error extracting subject thread response metadata:', error);
    return {
      subjectThreadId: record.subjectThreadId,
      type: record.type,
      userId: record.userId
    };
  }
};

export const subjectThreadResponseToDocument = (record: SubjectThreadResponse): Document => {
  const parentInfo = record.parentResponseId ? `\nParent Response ID: ${record.parentResponseId}` : '';
  const content = `Type: ${record.type}${parentInfo}\n\n${record.content}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      type: record.type,
      subjectThreadId: record.subjectThreadId,
      userId: record.userId,
      parentResponseId: record.parentResponseId,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToSubjectThreadResponse = (doc: Document): Partial<SubjectThreadResponse> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract type, parent response ID, and content
  const lines = doc.pageContent.split('\n\n');
  const firstLine = lines[0] || '';
  
  const typeMatch = firstLine.match(/Type:\s*(.+?)(?:\nParent Response ID:\s*(.+))?$/s);
  const type = typeMatch ? typeMatch[1].trim() : metadata.type;
  const parentResponseId = typeMatch && typeMatch[2] ? parseInt(typeMatch[2].trim(), 10) : undefined;
  
  const content = lines[1] || '';
  
  return {
    type: type as subjectThreadResponseTypeEnum,
    subjectThreadId: metadata.subjectThreadId as number,
    userId: metadata.userId as string,
    content,
    parentResponseId: parentResponseId || (metadata.parentResponseId as number | undefined)
  };
};
