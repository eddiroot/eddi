import { taskBlock, type TaskBlockMisconception } from "$lib/server/db/schema/task";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class TaskBlockMisconceptionVectorStore extends TableVectorStore<TaskBlockMisconception> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      toDocument: taskBlockMisconceptionToDocument,
      fromDocument: taskBlockMisconceptionFromDocument
    });
  }
}

export const taskBlockMisconceptionToDocument = (record: TaskBlockMisconception): Document => {
    return new Document({
        pageContent: `Misconception: ${record.misconception}`,
        metadata: {
            taskBlockId: record.taskBlockId,
            taskId: record.taskId,
        }
    });
}

export const taskBlockMisconceptionFromDocument = (doc: Document): Partial<TaskBlockMisconception> => {
    return {
        taskBlockId: doc.metadata.taskBlockId,
        taskId: doc.metadata.taskId,
        misconception: doc.pageContent.replace('Misconception: ', ''),
    };
}
