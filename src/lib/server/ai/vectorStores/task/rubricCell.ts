
import { taskBlock, type RubricCell } from "$lib/server/db/schema/task";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class RubricCellVectorStore extends TableVectorStore<RubricCell> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      toDocument: rubricCellToDocument,
      fromDocument: documentToRubricCell
    });
  }
}

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
    const level = levelMatch as "exemplary" | "accomplished" | "developing" | "beginning" | undefined;
    return {
        rowId: doc.metadata.rowId,
        level: level || undefined,
        description: doc.pageContent.match(/Description: (.*), Marks:/)?.[1] || '',
        marks: parseFloat(doc.pageContent.match(/Marks: (.*)/)?.[1] || '0'),
    };
}