import { taskBlock, type TaskBlockGuidance } from "$lib/server/db/schema/task";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class TaskBlockGuidanceVectorStore extends TableVectorStore<TaskBlockGuidance> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      toDocument: taskBlockGuidanceToDocument,
      fromDocument: documentToTaskBlockGuidance
    });
  }
}

export const taskBlockGuidanceToDocument = (record: TaskBlockGuidance): Document => {
    return new Document({
        pageContent: `Guidance: ${record.guidance}`,
        metadata: {
            taskBlockId: record.taskBlockId,
            taskId: record.taskId,
        }
    });
}

export const documentToTaskBlockGuidance = (doc: Document): Partial<TaskBlockGuidance> => {
    return {
        taskBlockId: doc.metadata.taskBlockId,
        taskId: doc.metadata.taskId,
        guidance: doc.pageContent.replace('Guidance: ', ''),
    };
}