import {
    pgTable,
    text,
    integer,
    uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { user } from './user';

export const chatbotChat = pgTable('chatbot_chat', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
    ...timestamps
});

export type ChatbotChat = typeof chatbotChat.$inferSelect;

export const chatbotMessage = pgTable('chatbot_message', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
    authorId: uuid('author_id').references(() => user.id, { onDelete: 'cascade' }),
    chatId: integer('chat_id')
        .notNull()
        .references(() => chatbotChat.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    ...timestamps
});

export type ChatbotMessage = typeof chatbotMessage.$inferSelect;