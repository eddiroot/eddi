import { z } from 'zod/v4';

// Common validation helpers
const eventNameSchema = z
	.string()
	.min(1, 'Event name is required')
	.max(255, 'Event name cannot exceed 255 characters');

const eventTimestampSchema = z.iso.datetime({ local: true })
	.min(1, 'Please provide a valid date and time');

export const createSchoolEventSchema = z
	.object({
		name: eventNameSchema,
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		error: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const createCampusEventSchema = z
	.object({
		name: eventNameSchema,
		campusId: z.coerce.number().int().positive('Please select a campus'),
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		error: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const createSubjectOfferingEventSchema = z
	.object({
		name: eventNameSchema,
		subjectOfferingId: z.coerce.number().int().positive('Please select a subject offering'),
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		error: 'End time must be after start time',
		path: ['endTimestamp']
	});

export const createSubjectOfferingClassEventSchema = z
	.object({
		name: eventNameSchema,
		subjectOfferingClassId: z.coerce.number().int().positive('Please select a class'),
		startTimestamp: eventTimestampSchema,
		endTimestamp: eventTimestampSchema
	})
	.refine((data) => data.endTimestamp > data.startTimestamp, {
		error: 'End time must be after start time',
		path: ['endTimestamp']
	});