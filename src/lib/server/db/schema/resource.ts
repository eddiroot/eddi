import { pgTable, text, integer, boolean, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './utils';
import { user } from './user';

export const resource = pgTable('res', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	fileName: text('file_name').notNull(),
	objectKey: text('object_key').notNull(),
	bucketName: text('bucket_name').notNull().default('schools'),
	contentType: text('content_type').notNull(),
	fileSize: integer('file_size').notNull(),
	resourceType: text('resource_type').notNull(),
	uploadedBy: uuid('uploaded_by')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Resource = typeof resource.$inferSelect;
