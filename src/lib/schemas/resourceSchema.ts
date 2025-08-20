import { z } from 'zod';

// Constants for file validation
const MAX_MB_COUNT = 50; // Increased for resources which might be larger
const MAX_UPLOAD_SIZE = 1024 * 1024 * MAX_MB_COUNT;

// Comprehensive list of accepted file types for resources
const ACCEPTED_FILE_TYPES = [
	// Images
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/gif',
	'image/bmp',
	'image/webp',
	'image/svg+xml',
	// Videos
	'video/mp4',
	'video/quicktime', // .mov
	'video/x-msvideo', // .avi
	'video/x-matroska', // .mkv
	'video/webm',
	'video/x-ms-wmv', // .wmv
	// Audio
	'audio/mpeg', // .mp3
	'audio/wav',
	'audio/ogg',
	'audio/flac',
	'audio/mp4', // .m4a
	// Documents
	'application/pdf',
	'application/msword', // .doc
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
	'text/plain', // .txt
	'application/rtf', // .rtf
	'application/vnd.ms-excel', // .xls
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
	'application/vnd.ms-powerpoint', // .ppt
	'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
	// Other common file types
	'application/zip',
	'application/x-zip-compressed',
	'application/x-rar-compressed',
	'text/csv',
	'application/json'
];

// Human-readable file types for error messages
const ACCEPTED_FILE_TYPES_HR = [
	'PNG', 'JPEG', 'JPG', 'GIF', 'BMP', 'WEBP', 'SVG',
	'MP4', 'MOV', 'AVI', 'MKV', 'WEBM', 'WMV',
	'MP3', 'WAV', 'OGG', 'FLAC', 'M4A',
	'PDF', 'DOC', 'DOCX', 'TXT', 'RTF', 'XLS', 'XLSX', 'PPT', 'PPTX',
	'ZIP', 'RAR', 'CSV', 'JSON'
].join(', ');

// Resource types enum based on the application logic
const RESOURCE_TYPES = [
	'image',
	'video',
	'audio',
	'pdf',
	'document',
	'file'
] as const;

// File schema for single resource upload
export const resourceFileSchema = z
	.instanceof(File)
	.refine((file) => {
		return file.size <= MAX_UPLOAD_SIZE;
	}, `File size must be less than ${MAX_MB_COUNT}MB`)
	.refine((file) => {
		return ACCEPTED_FILE_TYPES.includes(file.type);
	}, `File must be one of: ${ACCEPTED_FILE_TYPES_HR}`);

// Multiple files schema for batch uploads
export const resourceFilesSchema = z
	.array(resourceFileSchema)
	.min(1, 'At least one file is required')
	.max(10, 'Maximum 10 files allowed per upload');

// Resource type schema
export const resourceTypeSchema = z.enum(RESOURCE_TYPES);

// Function to infer resource type from MIME type
export function inferResourceTypeFromMimeType(mimeType: string): string {
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';
	if (mimeType === 'application/pdf') return 'pdf';
	if (
		mimeType.includes('document') ||
		mimeType.includes('word') ||
		mimeType.includes('text') ||
		mimeType.includes('spreadsheet') ||
		mimeType.includes('excel') ||
		mimeType.includes('presentation') ||
		mimeType.includes('powerpoint')
	) {
		return 'document';
	}
	return 'file';
}

// Function to infer resource type from file extension (fallback)
export function inferResourceTypeFromFileName(fileName: string): string {
	const extension = fileName.split('.').pop()?.toLowerCase();
	
	switch (extension) {
		case 'jpg':
		case 'jpeg':
		case 'png':
		case 'gif':
		case 'bmp':
		case 'webp':
		case 'svg':
			return 'image';
		case 'mp4':
		case 'mov':
		case 'avi':
		case 'mkv':
		case 'webm':
		case 'wmv':
			return 'video';
		case 'mp3':
		case 'wav':
		case 'ogg':
		case 'flac':
		case 'm4a':
			return 'audio';
		case 'pdf':
			return 'pdf';
		case 'doc':
		case 'docx':
		case 'txt':
		case 'rtf':
		case 'xls':
		case 'xlsx':
		case 'ppt':
		case 'pptx':
			return 'document';
		default:
			return 'file';
	}
}

// Base resource schema for creating resources
export const createResourceSchema = z.object({
	fileName: z
		.string()
		.min(1, 'File name is required')
		.max(255, 'File name must not exceed 255 characters'),
	file: resourceFileSchema,
	resourceType: resourceTypeSchema.optional(), // Will be inferred if not provided
	description: z
		.string()
		.max(500, 'Description cannot exceed 500 characters')
		.optional()
});

// Schema for updating resource metadata
export const updateResourceSchema = z.object({
	fileName: z
		.string()
		.min(1, 'File name is required')
		.max(255, 'File name must not exceed 255 characters')
		.optional(),
	resourceType: resourceTypeSchema.optional(),
	description: z
		.string()
		.max(500, 'Description cannot exceed 500 characters')
		.optional(),
	isArchived: z.boolean().optional()
});

// Schema for resource upload form (multiple files)
export const resourceUploadFormSchema = z.object({
	files: resourceFilesSchema,
	resourceType: resourceTypeSchema.optional(), // Applied to all files if specified
	description: z
		.string()
		.max(500, 'Description cannot exceed 500 characters')
		.optional()
});

// Schema for linking resources to entities (course items, lesson plans, etc.)
export const resourceLinkSchema = z.object({
	resourceId: z.number().positive('Resource ID must be a positive number'),
	entityId: z.number().positive('Entity ID must be a positive number'),
	entityType: z.enum([
		'courseMapItem',
		'lessonPlan', 
		'assessmentPlan',
		'subjectOfferingClass',
		'task'
	]),
	description: z
		.string()
		.max(250, 'Link description cannot exceed 250 characters')
		.optional()
});

// Validation schema for resource queries/filters
export const resourceQuerySchema = z.object({
	resourceType: resourceTypeSchema.optional(),
	search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
	isArchived: z.boolean().default(false),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
	sortBy: z.enum(['fileName', 'createdAt', 'fileSize', 'resourceType']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Type exports
export type ResourceFileSchema = typeof resourceFileSchema;
export type ResourceFilesSchema = typeof resourceFilesSchema;
export type ResourceTypeSchema = typeof resourceTypeSchema;
export type CreateResourceSchema = typeof createResourceSchema;
export type UpdateResourceSchema = typeof updateResourceSchema;
export type ResourceUploadFormSchema = typeof resourceUploadFormSchema;
export type ResourceLinkSchema = typeof resourceLinkSchema;
export type ResourceQuerySchema = typeof resourceQuerySchema;

// Inferred types
export type ResourceFile = z.infer<typeof resourceFileSchema>;
export type ResourceFiles = z.infer<typeof resourceFilesSchema>;
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type CreateResource = z.infer<typeof createResourceSchema>;
export type UpdateResource = z.infer<typeof updateResourceSchema>;
export type ResourceUploadForm = z.infer<typeof resourceUploadFormSchema>;
export type ResourceLink = z.infer<typeof resourceLinkSchema>;
export type ResourceQuery = z.infer<typeof resourceQuerySchema>;

// Export constants for use in other parts of the application
export {
	MAX_MB_COUNT,
	MAX_UPLOAD_SIZE,
	ACCEPTED_FILE_TYPES,
	ACCEPTED_FILE_TYPES_HR,
	RESOURCE_TYPES
};
