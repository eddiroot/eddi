import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { user } from './user';
import { timestamps } from './utils';

export const chatbotChat = pgTable('cb_chat', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
	...timestamps
});

export type ChatbotChat = typeof chatbotChat.$inferSelect;

export const chatbotMessage = pgTable('cb_msg', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	authorId: uuid('author_id').references(() => user.id, { onDelete: 'cascade' }),
	chatId: integer('cb_chat_id')
		.notNull()
		.references(() => chatbotChat.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	...timestamps
});

export type ChatbotMessage = typeof chatbotMessage.$inferSelect;
