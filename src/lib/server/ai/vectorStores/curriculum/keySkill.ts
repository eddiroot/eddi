import { keySkill, type KeySkill } from "$lib/server/db/schema";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getKeySkillMetadata } from "$lib/server/db/service/curriculum";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class KeySkillVectorStore extends TableVectorStore<KeySkill> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: keySkill,
      embeddings,
      toDocument: keySkillToDocument,
      fromDocument: documentToKeySkill,
      extractMetadata: extractKeySkillMetadata
    });
  }
}

export const extractKeySkillMetadata = async (
  record: Partial<KeySkill>
): Promise<EmbeddingMetadataFilter> => {
  try {
    const metadata = await getKeySkillMetadata(record.curriculumSubjectId, record.outcomeId);
    
    return {
      ...metadata,
      number: record.number,
      topicName: record.topicName
    };
  } catch (error) {
    console.error('Error extracting key skill metadata:', error);
    return {
      curriculumSubjectId: record.curriculumSubjectId ?? undefined,
      outcomeId: record.outcomeId ?? undefined,
      number: record.number
    };
  }
};

export const keySkillToDocument = (record: KeySkill): Document => {
  const topicPart = record.topicName ? `\nTopic: ${record.topicName}` : '';
  const content = `Key Skill ${record.number}: ${record.description}${topicPart}`;
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

export const documentToKeySkill = (doc: Document): Partial<KeySkill> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract number, description, and topic
  const match = doc.pageContent.match(/Key Skill\s+(\d+):\s*(.+?)(?:\nTopic:\s*(.+))?$/s);
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
