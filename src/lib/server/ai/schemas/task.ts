import { z } from 'zod';
/**
 * Agenda Item Types
 */
export const agendaItemTypeEnum = z.enum([
    'warm_up',           
    'introduction',      
    'instruction',       
    'guided_practice',   
    'independent_work',  
    'group_activity',    
    'discussion',        
    'assessment',        
    'closure',           
    'break',             
    'custom'             
]);

export type AgendaItemType = z.infer<typeof agendaItemTypeEnum>;

/**
 * Single Agenda Item
 */
export const agendaItemSchema = z.object({
    id: z.string().optional(),
    type: agendaItemTypeEnum,
    title: z.string().describe('Title of this agenda item'),
    description: z.string().optional().describe('Brief description of what happens in this section'),
    durationMinutes: z.number().min(1).max(180).describe('Duration in minutes'),
    index: z.number().describe('Position in the lesson sequence'),
});

export type AgendaItem = z.infer<typeof agendaItemSchema>;

/**
 * Complete Lesson Agenda
 */
export const agendaSchema = z.object({
    items: z.array(agendaItemSchema).describe('Ordered list of agenda items for the lesson'),
});

export type Agenda = z.infer<typeof agendaSchema>;