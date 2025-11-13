import { taskAgenda, type TaskAgenda } from "$lib/server/db/schema/task";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { agendaSchema, type Agenda, type AgendaItem } from "../../schemas/task";
import { TableVectorStore } from "../base";

export class TaskAgendaVectorStore extends TableVectorStore<TaskAgenda> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskAgenda,
      embeddings,
      toDocument: taskAgendaToDocument,
      fromDocument: documentToTaskAgenda
    });
  }
}

/**
 * Convert TaskAgenda record to LangChain Document
 */
export const taskAgendaToDocument = (record: TaskAgenda): Document => {
    // Parse the agenda config
    const agenda = agendaSchema.parse(record.config);
    
    // Format agenda items into readable text
    const itemsText = agenda.items
        .sort((a, b) => a.index - b.index)
        .map(item => formatAgendaItem(item))
        .join('\n\n');
    
    // Calculate total duration
    const totalDuration = agenda.items.reduce((sum, item) => sum + item.durationMinutes, 0);
    
    // Create the page content
    const pageContent = `Lesson Agenda
    Total Duration: ${totalDuration} minutes
    Number of Activities: ${agenda.items.length}

    Activities:
    ${itemsText}`;

    return new Document({
        pageContent,
        metadata: {
            id: record.id,
            taskId: record.taskId,
            totalDuration,
            itemCount: agenda.items.length,
            itemTypes: Array.from(new Set(agenda.items.map(i => i.type))),
            createdAt: record.createdAt?.toISOString(),
            updatedAt: record.updatedAt?.toISOString(),
            embeddingMetadata: record.embeddingMetadata
        }
    });
};

/**
 * Convert LangChain Document back to TaskAgenda record
 */
export const documentToTaskAgenda = (doc: Document): Partial<TaskAgenda> => {
    // Extract items from the document content
    const items = parseAgendaItemsFromDocument(doc);
    
    // Validate and create agenda config
    const agenda: Agenda = {
        items
    };
    
    // Validate against schema
    agendaSchema.parse(agenda);
    
    return {
        taskId: doc.metadata.taskId as number,
        config: agenda
    };
};

/**
 * Format a single agenda item as text
 */
function formatAgendaItem(item: AgendaItem): string {
    const parts = [
        `${item.index}. ${item.title}`,
        `   Type: ${item.type}`,
        `   Duration: ${item.durationMinutes} minutes`
    ];
    
    if (item.description) {
        parts.push(`   Description: ${item.description}`);
    }
    
    return parts.join('\n');
}

/**
 * Parse agenda items from document content
 */
function parseAgendaItemsFromDocument(doc: Document): AgendaItem[] {
    const items: AgendaItem[] = [];
    
    // Try to extract from metadata first (more reliable)
    if (doc.metadata.items && Array.isArray(doc.metadata.items)) {
        return doc.metadata.items;
    }
    
    // Otherwise parse from pageContent
    const content = doc.pageContent;
    const activitySection = content.split('Activities:')[1];
    
    if (!activitySection) {
        return [];
    }
    
    // Split by double newlines to get individual items
    const itemBlocks = activitySection
        .trim()
        .split('\n\n')
        .filter(block => block.trim());
    
    for (const block of itemBlocks) {
        const lines = block.split('\n').map(l => l.trim());
        
        // Extract title and index from first line (e.g., "1. Warm-up Activity")
        const firstLine = lines[0];
        const titleMatch = firstLine.match(/^(\d+)\.\s+(.+)$/);
        
        if (!titleMatch) continue;
        
        const index = parseInt(titleMatch[1], 10);
        const title = titleMatch[2];
        
        // Extract type
        const typeLine = lines.find(l => l.startsWith('Type:'));
        const typeMatch = typeLine?.match(/Type:\s*(.+)$/);
        const type = typeMatch ? typeMatch[1].trim() : 'custom';
        
        // Extract duration
        const durationLine = lines.find(l => l.startsWith('Duration:'));
        const durationMatch = durationLine?.match(/Duration:\s*(\d+)/);
        const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : 15;
        
        // Extract description
        const descriptionLine = lines.find(l => l.startsWith('Description:'));
        const descriptionMatch = descriptionLine?.match(/Description:\s*(.+)$/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : undefined;
        
        items.push({
            index,
            title,
            type: type as AgendaItem['type'],
            durationMinutes,
            description
        });
    }
    
    return items;
}
