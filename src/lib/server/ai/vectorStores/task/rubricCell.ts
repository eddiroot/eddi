import type { rubricLevelEnum } from "$lib/enums";
import { taskBlock, type RubricCell } from "$lib/server/db/schema/task";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getRubricCellMetadataByRowId } from "$lib/server/db/service/task";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class RubricCellVectorStore extends TableVectorStore<RubricCell> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      toDocument: rubricCellToDocument,
      fromDocument: documentToRubricCell,
      extractMetadata: extractRubricCellMetadata
    });
  }
}

/**
 * Extract metadata for a RubricCell by querying related tables
 */
export const extractRubricCellMetadata = async (
  record: Partial<RubricCell>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.rowId) {
    return {
      level: record.level,
      marks: record.marks
    };
  }

  try {
    const metadata = await getRubricCellMetadataByRowId(record.rowId);
    
    return {
      ...metadata,
      rowId: record.rowId,
      level: record.level,
      marks: record.marks
    };
  } catch (error) {
    console.error('Error extracting rubric cell metadata:', error);
    return {
      rowId: record.rowId,
      level: record.level
    };
  }
};

export const rubricCellToDocument = (record: RubricCell): Document => {
    return new Document({
        pageContent: `Level: ${record.level}, Description: ${record.description}, Marks: ${record.marks}`,
        metadata: {
            rowId: record.rowId,
        }
    });
}

export const documentToRubricCell = (doc: Document): Partial<RubricCell> => {
    const levelMatch = doc.pageContent.match(/Level: (.*), Description:/)?.[1] || '';
    const level = levelMatch as rubricLevelEnum
    return {
        rowId: doc.metadata.rowId,
        level: level || undefined,
        description: doc.pageContent.match(/Description: (.*), Marks:/)?.[1] || '',
        marks: parseFloat(doc.pageContent.match(/Marks: (.*)/)?.[1] || '0'),
    };
}