import { outcome, type Outcome } from "$lib/server/db/schema";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getOutcomeMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class OutcomeVectorStore extends TableVectorStore<Outcome> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: outcome,
      embeddings,
      toDocument: outcomeToDocument,
      fromDocument: documentToOutcome,
      extractMetadata: extractOutcomeMetadata
    });
  }
}

export const extractOutcomeMetadata = async (
  record: Partial<Outcome>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.curriculumSubjectId) {
    return {
      number: record.number
    };
  }

  try {
    const metadata = await getOutcomeMetadataByCurriculumSubjectId(record.curriculumSubjectId);
    
    return {
      ...metadata,
      number: record.number
    };
  } catch (error) {
    console.error('Error extracting outcome metadata:', error);
    return {
      curriculumSubjectId: record.curriculumSubjectId,
      number: record.number
    };
  }
};

export const outcomeToDocument = (record: Outcome): Document => {
  const content = `Outcome ${record.number}: ${record.description}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      curriculumSubjectId: record.curriculumSubjectId,
      number: record.number,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToOutcome = (doc: Document): Partial<Outcome> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract number and description
  const match = doc.pageContent.match(/Outcome\s+(\d+):\s*(.+)/s);
  const number = match ? parseInt(match[1], 10) : 1;
  const description = match ? match[2].trim() : doc.pageContent;
  
  return {
    curriculumSubjectId: metadata.curriculumSubjectId as number,
    number,
    description
  };
};
