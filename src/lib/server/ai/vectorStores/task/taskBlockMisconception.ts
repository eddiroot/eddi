import { taskBlock, type TaskBlockMisconception } from "$lib/server/db/schema/task";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getTaskBlockMisconceptionMetadataByTaskBlockId } from "$lib/server/db/service/task";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class TaskBlockMisconceptionVectorStore extends TableVectorStore<TaskBlockMisconception> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      toDocument: taskBlockMisconceptionToDocument,
      fromDocument: taskBlockMisconceptionFromDocument,
      extractMetadata: extractTaskBlockMisconceptionMetadata
    });
  }
}

/**
 * Extract metadata for a TaskBlockMisconception by querying related tables
 */
export const extractTaskBlockMisconceptionMetadata = async (
  record: Partial<TaskBlockMisconception>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.taskBlockId) {
    return {};
  }

  try {
    const metadata = await getTaskBlockMisconceptionMetadataByTaskBlockId(record.taskBlockId);
    
    return {
      ...metadata,
      taskBlockId: record.taskBlockId
    };
  } catch (error) {
    console.error('Error extracting task block misconception metadata:', error);
    return {
      taskBlockId: record.taskBlockId
    };
  }
};

export const taskBlockMisconceptionToDocument = (record: TaskBlockMisconception): Document => {
    return new Document({
        pageContent: `Misconception: ${record.misconception}`,
        metadata: {
            taskBlockId: record.taskBlockId,
        }
    });
}

export const taskBlockMisconceptionFromDocument = (doc: Document): Partial<TaskBlockMisconception> => {
    return {
        taskBlockId: doc.metadata.taskBlockId,
        misconception: doc.pageContent.replace('Misconception: ', ''),
    };
}
