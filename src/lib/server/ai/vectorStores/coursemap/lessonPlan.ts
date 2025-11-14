import { courseMapItemLessonPlan, type CourseMapItemLessonPlan } from "$lib/server/db/schema";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class CourseMapItemLessonPlanVectorStore extends TableVectorStore<CourseMapItemLessonPlan> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: courseMapItemLessonPlan,
      embeddings,
      toDocument: courseMapItemLessonPlanToDocument,
      fromDocument: documentToCourseMapItemLessonPlan
    });
  }
}

export const courseMapItemLessonPlanToDocument = (record: CourseMapItemLessonPlan): Document => {
  const content = `${record.name}\n\n${record.description || ""}\n\nScope: ${record.scope?.join(", ") || "N/A"}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      courseMapItemId: record.courseMapItemId,
    }
  });
}

export const documentToCourseMapItemLessonPlan = (doc: Document): Partial<CourseMapItemLessonPlan> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract name, description, and scope
  const lines = doc.pageContent.split('\n\n');
  const name = lines[0] || '';
  const description = lines[1] || '';
  const scopeMatch = lines[2]?.match(/Scope:\s*(.+)/);
  const scopeStr = scopeMatch ? scopeMatch[1] : '';
  const scope = scopeStr && scopeStr !== 'N/A' ? scopeStr.split(', ').filter(s => s.trim()) : null;
  
  return {
    courseMapItemId: metadata.courseMapItemId as number,
    name,
    scope: scope as string[] | undefined,
    description: description || undefined,
  };
};
