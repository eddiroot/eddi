import { newsPriorityEnum, newsStatusEnum, newsVisibilityEnum } from "$lib/enums";
import { news, type News } from "$lib/server/db/schema";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getNewsMetadataBySchoolId } from "$lib/server/db/service/news";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class NewsVectorStore extends TableVectorStore<News> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: news,
      embeddings,
      toDocument: newsToDocument,
      fromDocument: documentToNews,
      extractMetadata: extractNewsMetadata
    });
  }
}

export const extractNewsMetadata = async (
  record: Partial<News>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.schoolId) {
    return {
      authorId: record.authorId,
      status: record.status,
      visibility: record.visibility,
      priority: record.priority,
      isPinned: record.isPinned
    };
  }

  try {
    const metadata = await getNewsMetadataBySchoolId(
      record.schoolId,
      record.campusId,
      record.categoryId,
      record.authorId
    );
    
    return {
      ...metadata,
      status: record.status,
      visibility: record.visibility,
      priority: record.priority,
      isPinned: record.isPinned,
      tags: record.tags
    };
  } catch (error) {
    console.error('Error extracting news metadata:', error);
    return {
      schoolId: record.schoolId,
      authorId: record.authorId
    };
  }
};

export const newsToDocument = (record: News): Document => {
  const excerptPart = record.excerpt ? `\n\nExcerpt: ${record.excerpt}` : '';
  const categoryPart = record.categoryId ? `\nCategory ID: ${record.categoryId}` : '';
  const tagsPart = record.tags ? `\nTags: ${JSON.stringify(record.tags)}` : '';
  
  // Handle content - could be rich text JSON or plain text
  let contentText = '';
  if (typeof record.content === 'string') {
    contentText = record.content;
  } else if (record.content && typeof record.content === 'object') {
    contentText = JSON.stringify(record.content);
  }
  
  const content = `${record.title}${excerptPart}${categoryPart}${tagsPart}\n\nStatus: ${record.status} | Priority: ${record.priority} | Visibility: ${record.visibility}\n\nContent:\n${contentText}`;
  
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      title: record.title,
      schoolId: record.schoolId,
      campusId: record.campusId,
      categoryId: record.categoryId,
      authorId: record.authorId,
      status: record.status,
      priority: record.priority,
      visibility: record.visibility,
      publishedAt: record.publishedAt,
      expiresAt: record.expiresAt,
      tags: record.tags,
      isPinned: record.isPinned,
      viewCount: record.viewCount,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToNews = (doc: Document): Partial<News> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract title, excerpt, category, tags, status, priority, visibility, and content
  const lines = doc.pageContent.split('\n\n');
  
  // Extract title and optional parts from first line
  const firstSection = lines[0] || '';
  const titleMatch = firstSection.match(/^(.+?)(?:\n|$)/);
  const title = titleMatch ? titleMatch[1].trim() : firstSection.split('\n')[0];
  
  const excerptMatch = firstSection.match(/Excerpt:\s*(.+?)(?:\n|$)/s);
  const excerpt = excerptMatch ? excerptMatch[1].trim() : undefined;
  
  const categoryMatch = firstSection.match(/Category ID:\s*(\d+)/);
  const categoryId = categoryMatch ? parseInt(categoryMatch[1], 10) : undefined;
  
  const tagsMatch = firstSection.match(/Tags:\s*(.+?)(?:\n|$)/s);
  let tags = undefined;
  if (tagsMatch) {
    try {
      tags = JSON.parse(tagsMatch[1].trim());
    } catch {
      tags = undefined;
    }
  }
  
  // Extract status, priority, visibility
  const statusLine = lines[1] || '';
  const statusMatch = statusLine.match(/Status:\s*(\w+)/);
  const priorityMatch = statusLine.match(/Priority:\s*(\w+)/);
  const visibilityMatch = statusLine.match(/Visibility:\s*(\w+)/);
  
  const status = statusMatch ? statusMatch[1] : metadata.status;
  const priority = priorityMatch ? priorityMatch[1] : metadata.priority;
  const visibility = visibilityMatch ? visibilityMatch[1] : metadata.visibility;
  
  // Extract content (starts after "Content:" marker)
  const contentMatch = doc.pageContent.match(/Content:\s*([\s\S]+)/);
  let content: Record<string, unknown> | string = '';
  if (contentMatch) {
    const contentStr = contentMatch[1].trim();
    try {
      // Try to parse as JSON first
      content = JSON.parse(contentStr);
    } catch {
      // If not JSON, keep as string
      content = contentStr;
    }
  }
  
  return {
    title,
    excerpt,
    content: content as Record<string, unknown>,
    schoolId: metadata.schoolId as number,
    campusId: metadata.campusId as number | undefined,
    categoryId: categoryId || (metadata.categoryId as number | undefined),
    authorId: metadata.authorId as string,
    status: status as newsStatusEnum,
    priority: priority as newsPriorityEnum,
    visibility: visibility as newsVisibilityEnum,
    tags: tags || (metadata.tags as Record<string, unknown> | undefined),
    isPinned: metadata.isPinned as boolean | undefined
  };
};
