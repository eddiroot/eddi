import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';

export const resource = pgTable('resource', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	fileName: text('file_name').notNull(),
	objectKey: text('object_key').notNull(),
	bucketName: text('bucket_name').notNull().default('schools'),
	contentType: text('content_type').notNull(),
	fileSize: integer('file_size').notNull(),
	resourceType: text('resource_type').notNull(),
	uploadedBy: text('uploaded_by').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Resource = typeof resource.$inferSelect;
