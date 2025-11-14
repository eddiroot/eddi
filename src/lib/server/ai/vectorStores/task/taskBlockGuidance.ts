import { taskBlock, type TaskBlockGuidance } from "$lib/server/db/schema/task";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getTaskBlockGuidanceMetadataByTaskBlockId } from "$lib/server/db/service/task";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class TaskBlockGuidanceVectorStore extends TableVectorStore<TaskBlockGuidance> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      toDocument: taskBlockGuidanceToDocument,
      fromDocument: documentToTaskBlockGuidance,
      extractMetadata: extractTaskBlockGuidanceMetadata
    });
  }
}

/**
 * Extract metadata for a TaskBlockGuidance by querying related tables
 */
export const extractTaskBlockGuidanceMetadata = async (
  record: Partial<TaskBlockGuidance>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.taskBlockId) {
    return {};
  }

  try {
    const metadata = await getTaskBlockGuidanceMetadataByTaskBlockId(record.taskBlockId);
    
    return {
      ...metadata,
      taskBlockId: record.taskBlockId
    };
  } catch (error) {
    console.error('Error extracting task block guidance metadata:', error);
    return {
      taskBlockId: record.taskBlockId
    };
  }
};

export const taskBlockGuidanceToDocument = (record: TaskBlockGuidance): Document => {
    return new Document({
        pageContent: `Guidance: ${record.guidance}`,
        metadata: {
            taskBlockId: record.taskBlockId,
        }
    });
}

export const documentToTaskBlockGuidance = (doc: Document): Partial<TaskBlockGuidance> => {
    return {
        taskBlockId: doc.metadata.taskBlockId,
        guidance: doc.pageContent.replace('Guidance: ', ''),
    };
}