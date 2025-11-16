import { curriculumSubjectExtraContent, type CurriculumSubjectExtraContent } from "$lib/server/db/schema";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getCurriculumSubjectExtraContentMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class CurriculumSubjectExtraContentVectorStore extends TableVectorStore<CurriculumSubjectExtraContent> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: curriculumSubjectExtraContent,
      embeddings,
      toDocument: curriculumSubjectExtraContentToDocument,
      fromDocument: documentToCurriculumSubjectExtraContent,
      extractMetadata: extractCurriculumSubjectExtraContentMetadata
    });
  }
}

/**
 * Extract contentType from the standardized format in content field
 * Format: "ContentType: {type}\n\n{actual content}"
 */
function extractContentType(content: string): string {
  const match = content.match(/^ContentType:\s*(\w+)\s*\n\n/);
  return match ? match[1] : 'unknown';
}

/**
 * Extract the actual content (without the ContentType prefix)
 */
function extractActualContent(content: string): string {
  const match = content.match(/^ContentType:\s*\w+\s*\n\n(.*)$/s);
  return match ? match[1] : content;
}

export const extractCurriculumSubjectExtraContentMetadata = async (
  record: Partial<CurriculumSubjectExtraContent>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.curriculumSubjectId) {
    return {
      contentType: record.content ? extractContentType(record.content) : undefined
    };
  }

  try {
    const metadata = await getCurriculumSubjectExtraContentMetadataByCurriculumSubjectId(record.curriculumSubjectId);
    const contentType = record.content ? extractContentType(record.content) : undefined;
    
    return {
      ...metadata,
      contentType
    };
  } catch (error) {
    console.error('Error extracting curriculum subject extra content metadata:', error);
    return {
      curriculumSubjectId: record.curriculumSubjectId,
      contentType: record.content ? extractContentType(record.content) : undefined
    };
  }
};

export const curriculumSubjectExtraContentToDocument = (record: CurriculumSubjectExtraContent): Document => {
  const contentType = extractContentType(record.content);
  const actualContent = extractActualContent(record.content);
  
  // Format the document with contentType as a label
  const pageContent = `[${contentType}] ${actualContent}`;
  
  return new Document({
    pageContent,
    metadata: {
      id: record.id,
      curriculumSubjectId: record.curriculumSubjectId,
      contentType,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToCurriculumSubjectExtraContent = (doc: Document): Partial<CurriculumSubjectExtraContent> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract contentType and actual content
  const match = doc.pageContent.match(/^\[(\w+)\]\s*(.*)$/s);
  const contentType = match ? match[1] : 'unknown';
  const actualContent = match ? match[2] : doc.pageContent;
  
  // Reconstruct the standardized format
  const content = `ContentType: ${contentType}\n\n${actualContent}`;
  
  return {
    curriculumSubjectId: metadata.curriculumSubjectId as number | undefined,
    content
  };
};
