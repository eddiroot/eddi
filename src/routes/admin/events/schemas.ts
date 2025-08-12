import { z } from 'zod/v4';

// Common validation helpers
const eventNameSchema = z
	.string()
	.min(1, 'Event name is required')
	.max(255, 'Event name cannot exceed 255 characters');

const eventTimestampSchema = z.coerce.date({
	message: 'Please provide a valid date and time'
});

// School Event Schemas
export const createSchoolEventSchema = z
	.object({
		name: eventNameSchema,
		schoolId: z.coerce.number().int().positive('Please provide your school ID'),
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		message: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const updateSchoolEventSchema = z
	.object({
		eventId: z.coerce.number().int().positive(),
		name: eventNameSchema,
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		message: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const archiveSchoolEventSchema = z.object({
	eventId: z.coerce.number().int().positive()
});

// Campus Event Schemas
export const createCampusEventSchema = z
	.object({
		name: eventNameSchema,
		campusId: z.coerce.number().int().positive('Please select a campus'),
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		message: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const updateCampusEventSchema = z
	.object({
		eventId: z.coerce.number().int().positive(),
		name: eventNameSchema,
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		message: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const archiveCampusEventSchema = z.object({
	eventId: z.coerce.number().int().positive()
});

// Subject Offering Event Schemas
export const createSubjectOfferingEventSchema = z
	.object({
		name: eventNameSchema,
		subjectOfferingId: z.coerce.number().int().positive('Please select a subject offering'),
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		message: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const updateSubjectOfferingEventSchema = z
	.object({
		eventId: z.coerce.number().int().positive(),
		name: eventNameSchema,
		subjectOfferingId: z.coerce.number().int().positive('Please select a subject offering'),
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		message: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const archiveSubjectOfferingEventSchema = z.object({
	eventId: z.coerce.number().int().positive()
});

// Subject Offering Class Event Schemas
export const createSubjectOfferingClassEventSchema = z
	.object({
		name: eventNameSchema,
		subjectOfferingClassId: z.coerce.number().int().positive('Please select a class'),
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		message: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const updateSubjectOfferingClassEventSchema = z
	.object({
		eventId: z.coerce.number().int().positive(),
		name: eventNameSchema,
		subjectOfferingClassId: z.coerce.number().int().positive('Please select a class'),
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		message: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const archiveSubjectOfferingClassEventSchema = z.object({
	eventId: z.coerce.number().int().positive()
});

// Type exports
export type CreateSchoolEventSchema = typeof createSchoolEventSchema;
export type UpdateSchoolEventSchema = typeof updateSchoolEventSchema;
export type ArchiveSchoolEventSchema = typeof archiveSchoolEventSchema;

export type CreateCampusEventSchema = typeof createCampusEventSchema;
export type UpdateCampusEventSchema = typeof updateCampusEventSchema;
export type ArchiveCampusEventSchema = typeof archiveCampusEventSchema;

export type CreateSubjectOfferingEventSchema = typeof createSubjectOfferingEventSchema;
export type UpdateSubjectOfferingEventSchema = typeof updateSubjectOfferingEventSchema;
export type ArchiveSubjectOfferingEventSchema = typeof archiveSubjectOfferingEventSchema;

export type CreateSubjectOfferingClassEventSchema = typeof createSubjectOfferingClassEventSchema;
export type UpdateSubjectOfferingClassEventSchema = typeof updateSubjectOfferingClassEventSchema;
export type ArchiveSubjectOfferingClassEventSchema = typeof archiveSubjectOfferingClassEventSchema;
