/* eslint-disable @typescript-eslint/no-explicit-any */
import { taskTypeEnum } from '$lib/enums';
import { yearLevelEnum } from '$lib/enums.js';
import { AgentAction, AgentType, type AgentContext } from '$lib/server/agents';
import { AgentOrchestrator } from '$lib/server/agents/orchestrator';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { createTask, createTaskBlock } from './task';

/**
 * Get all subjects that are available
 */
export async function getAllSubjects() {
	return await db
		.select()
		.from(table.subject)
		.where(eq(table.subject.isArchived, false))
		.orderBy(table.subject.name);
}

/**
 * Get subject by name or ID
 */
export async function getSubjectByIdentifier(identifier: string | number) {
	if (typeof identifier === 'number') {
		const [subject] = await db
			.select()
			.from(table.subject)
			.where(and(eq(table.subject.id, identifier), eq(table.subject.isArchived, false)));
		return subject;
	}

	// Try to match by a slug-like name format
	const normalizedName = identifier
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

	const subjects = await db.select().from(table.subject).where(eq(table.subject.isArchived, false));

	return subjects.find(
		(subject) =>
			subject.name.toLowerCase() === normalizedName.toLowerCase() ||
			subject.name.toLowerCase().includes(normalizedName.toLowerCase())
	);
}

/**
 * Get curriculum subject by name or ID (deprecated - use getSubjectByIdentifier)
 */
export async function getCurriculumSubjectByIdentifier(identifier: string | number) {
	return await getSubjectByIdentifier(identifier);
}

/**
 * Get all published modules for a curriculum subject
 */
export async function getModulesForSubject(subjectId: number) {
	return await db
		.select({
			id: table.module.id,
			title: table.module.title,
			description: table.module.description,
			isPublished: table.module.isPublished,
			orderIndex: table.module.orderIndex,
			createdAt: table.module.createdAt,
			updatedAt: table.module.updatedAt
		})
		.from(table.module)
		.where(eq(table.module.subjectId, subjectId))
		.orderBy(table.module.orderIndex, table.module.createdAt);
}

// ============================================================================
// SCHOOL & SUBJECT MANAGEMENT METHODS
// ============================================================================

/**
 * Get first school (for seeding)
 */
export async function getFirstSchool() {
	const [school] = await db.select().from(table.school).limit(1);
	return school;
}

/**
 * Get first campus for a school (for seeding)
 */
export async function getFirstCampusForSchool(schoolId: number) {
	const [campus] = await db
		.select()
		.from(table.campus)
		.where(eq(table.campus.schoolId, schoolId))
		.limit(1);
	return campus;
}

/**
 * Get or create VCE subject
 */
export async function getOrCreateVCESubject(
	subjectName: string,
	schoolId: number,
	coreSubjectId: number
) {
	const existingSubject = await db
		.select()
		.from(table.subject)
		.where(and(eq(table.subject.schoolId, schoolId), eq(table.subject.name, `VCE ${subjectName}`)));

	if (existingSubject.length > 0) {
		return { subject: existingSubject[0], isNew: false };
	}

	const [subject] = await db
		.insert(table.subject)
		.values({
			name: `VCE ${subjectName}`,
			schoolId: schoolId,
			coreSubjectId: coreSubjectId,
			yearLevel: yearLevelEnum.year10A, // VCE placeholder
			isArchived: false
		})
		.returning();

	return { subject, isNew: true };
}

/**
 * Create subject offering
 */
export async function createSubjectOffering(data: {
	subjectId: number;
	year: number;
	semester: number;
	campusId: number;
}) {
	const [subjectOffering] = await db
		.insert(table.subjectOffering)
		.values({
			...data,
			isArchived: false
		})
		.returning();

	return subjectOffering;
}

/**
 * Create subject offering class
 */
export async function createSubjectOfferingClass(data: { name: string; subOfferingId: number }) {
	return await db.insert(table.subjectOfferingClass).values({
		...data,
		isArchived: false
	});
}

// ============================================================================
// MODULE SESSION & MEMORY MANAGEMENT METHODS
// ============================================================================

export type ModuleAgentMemory = {
	recentResponses: number[]; // IDs of moduleResponse records
	strugglingConcepts: Array<{
		concept: string;
		mistakeCount: number;
	}>;
	masteredConcepts: Array<{
		concept: string;
		confidenceLevel: 'low' | 'medium' | 'high';
	}>;
	questionHistory: Array<{
		taskBlockId: number;
		evaluation?: string;
		feedBack?: string;
		hintHistory?: Array<{
			hintText: string;
			concept: string;
			wasEffective: boolean;
		}>;
	}>;
};

/**
 * Get or create module session
 */
export async function getOrCreateModuleSession(
	userId: string,
	moduleId: number,
	sessionType: 'teach' | 'train'
) {
	// Check for existing session
	const existing = await db
		.select()
		.from(table.moduleSession)
		.where(
			and(
				eq(table.moduleSession.userId, userId),
				eq(table.moduleSession.moduleId, moduleId),
				eq(table.moduleSession.sessionType, sessionType)
			)
		)
		.limit(1);

	if (existing.length > 0) {
		return existing[0];
	}

	// Create new session
	const [newSession] = await db
		.insert(table.moduleSession)
		.values({
			userId,
			moduleId,
			sessionType
		})
		.returning();

	return newSession;
}

/**
 * Get module session by ID
 */
export async function getModuleSessionById(sessionId: number) {
	const [session] = await db
		.select()
		.from(table.moduleSession)
		.where(eq(table.moduleSession.id, sessionId))
		.limit(1);

	return session || null;
}

/**
 * Update session memory
 */
export async function updateSessionMemory(sessionId: number, memory: ModuleAgentMemory) {
	await db
		.update(table.moduleSession)
		.set({
			agentMemory: memory,
			updatedAt: new Date()
		})
		.where(eq(table.moduleSession.id, sessionId));
}

/**
 * Complete session (mark as finished)
 */
export async function completeModuleSession(sessionId: number) {
	await db
		.update(table.moduleSession)
		.set({ updatedAt: new Date() })
		.where(eq(table.moduleSession.id, sessionId));
}

/**
 * Create module session (placeholder for module memory functionality)
 */
export async function createModuleSession(data: {
	moduleId: number;
	userId: number;
	sessionData: Record<string, unknown>;
}) {
	// This will be implemented when module schema is fully defined
	// For now, this is a placeholder
	console.log('Creating module session:', data);
	return { id: Date.now(), ...data };
}

/**
 * Store module memory (placeholder for module memory functionality)
 */
export async function storeModuleMemory(data: {
	sessionId: string;
	moduleId: number;
	memoryData: Record<string, unknown>;
}) {
	// This will be implemented when module schema is fully defined
	// For now, this is a placeholder
	console.log('Storing module memory:', data);
	return { id: Date.now(), ...data };
}

export interface ModuleGenerationParams {
	title: string;
	description: string;
	subjectId: number;
	subjectType: string;
}

export interface ModuleSection {
	title: string;
	objective: string;
	concepts: string[];
	skills: string[];
	contentBlocks: any[];
	interactiveBlocks: any[];
}

export interface ModuleScaffold {
	sections: Array<ModuleSection>;
}

/**
 * Main function to generate and store a complete module
 */
export async function generateAndStoreModule(params: ModuleGenerationParams) {
	const orchestrator = new AgentOrchestrator();

	try {
		const scaffoldContext: AgentContext = {
			metadata: {
				action: AgentAction.GENERATE_SCAFFOLD,
				moduleParams: {
					title: params.title,
					description: params.description,
					subjectId: params.subjectId,
					subjectType: params.subjectType
				}
			}
		};

		const scaffoldResponse = await orchestrator.executeAgent(
			AgentType.TEACH_MODULE_GENERATOR,
			scaffoldContext
		);

		let scaffold;
		try {
			scaffold = JSON.parse(scaffoldResponse.content);
		} catch (error) {
			console.error('Failed to parse scaffold response:', error);
			console.error('Scaffold response:', scaffoldResponse.content);
			throw new Error('Invalid JSON response from scaffold generation agent');
		}

		// Validate scaffold structure
		if (!scaffold.sections || !Array.isArray(scaffold.sections)) {
			console.error('Invalid scaffold structure:', scaffold);
			throw new Error('Scaffold missing sections array');
		}

		// Step 2: Create module in database
		const [module] = await db
			.insert(table.module)
			.values({
				subjectId: params.subjectId,
				title: params.title,
				description: params.description,
				objective: scaffold.overallObjective,
				isPublished: false
			})
			.returning();

		// Step 3: Process each section
		const sections: ModuleSection[] = [];

		for (let i = 0; i < scaffold.sections.length; i++) {
			const section = scaffold.sections[i];

			// Generate content for section
			const contentContext: AgentContext = {
				moduleId: module.id,
				metadata: {
					action: AgentAction.GENERATE_CONTENT,
					moduleParams: {
						subjectId: params.subjectId,
						section: section
					}
				}
			};

			const contentResponse = await orchestrator.executeAgent(
				AgentType.TEACH_MODULE_GENERATOR,
				contentContext
			);

			let contentData;
			try {
				contentData = JSON.parse(contentResponse.content);
			} catch (error) {
				console.error('Failed to parse content response:', error);
				console.error('Content response:', contentResponse.content);
				throw new Error('Invalid JSON response from content generation agent');
			}

			// Ensure contentData has blocks property
			if (!contentData.blocks) {
				console.warn('Content data missing blocks property, using empty array');
				contentData.blocks = [];
			}

			// Generate interactive blocks for section
			const interactiveContext: AgentContext = {
				...scaffoldContext,
				moduleId: module.id,
				metadata: {
					action: AgentAction.GENERATE_INTERACTIVE,
					moduleParams: {
						subjectId: params.subjectId,
						subjectType: params.subjectType,
						section: section,
						sectionContent: extractTextFromBlocks(contentData.blocks)
					}
				}
			};

			const interactiveResponse = await orchestrator.executeAgent(
				AgentType.TEACH_MODULE_GENERATOR,
				interactiveContext
			);

			let interactiveData;
			try {
				interactiveData = JSON.parse(interactiveResponse.content);
			} catch (error) {
				console.error('Failed to parse interactive response:', error);
				console.error('Interactive response:', interactiveResponse.content);
				// Provide fallback data structure
				interactiveData = { interactiveBlocks: [] };
			}

			// Ensure interactiveData has the expected structure
			if (!interactiveData.interactiveBlocks) {
				console.warn('Interactive data missing interactiveBlocks property, using empty array');
				interactiveData.interactiveBlocks = [];
			}

			sections.push({
				...section,
				contentBlocks: contentData.blocks,
				interactiveBlocks: interactiveData.interactiveBlocks
			});
		}

		// Step 4: Create tasks and subtasks for each section
		const moduleSubTasks = [];

		// Get a subject offering for this subject (from the seeded data)
		const [subjectOffering] = await db
			.select()
			.from(table.subjectOffering)
			.where(eq(table.subjectOffering.subjectId, params.subjectId))
			.limit(1);

		if (!subjectOffering) {
			throw new Error(`No subject offering found for subject ID ${params.subjectId}`);
		}

		for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
			const section = sections[sectionIndex];

			// Create a task for this section
			const task = await createTask(
				section.title,
				section.objective,
				1, // version
				taskTypeEnum.module,
				subjectOffering.id, // Use subjectOfferingId from seeded data
				true, // aiTutorEnabled
				false // isArchived
			);

			// Create module subtask
			const [moduleSubTask] = await db
				.insert(table.moduleSubTask)
				.values({
					moduleId: module.id,
					taskId: task.id,
					objective: section.objective,
					concepts: section.concepts,
					skills: section.skills,
					orderIndex: sectionIndex
				})
				.returning();

			// Add content blocks to task
			let blockIndex = 0;

			// Add content blocks
			for (const contentBlock of section.contentBlocks) {
				await createTaskBlock(task.id, contentBlock.type, contentBlock.config, blockIndex++);
			}

			// Add interactive blocks with metadata
			for (const interactiveItem of section.interactiveBlocks) {
				const block = interactiveItem.taskBlock;
				await createTaskBlock(task.id, block.type, block.config, blockIndex++);
			}

			moduleSubTasks.push(moduleSubTask);
		}

		return {
			module,
			subTasks: moduleSubTasks,
			sections
		};
	} catch (error) {
		console.error('Module generation failed:', error);
		throw new Error(
			`Failed to generate module: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

function extractTextFromBlocks(blocks: any[]): string {
	// Handle undefined or null blocks
	if (!blocks || !Array.isArray(blocks)) {
		console.warn('extractTextFromBlocks: blocks is not an array:', blocks);
		return '';
	}

	return blocks
		.map((block) => {
			if (!block || typeof block !== 'object') {
				return '';
			}

			switch (block.type) {
				case 'heading':
					return block.config?.text || '';
				case 'richText':
					// Strip HTML tags and clean up whitespace
					return (
						block.config?.html
							?.replace(/<[^>]*>/g, ' ')
							.replace(/\s+/g, ' ')
							.trim() || ''
					);
				default:
					return block.config?.text || block.config?.content || '';
			}
		})
		.filter((text) => text.length > 0)
		.join('\n\n');
}

/**
 * Get module with all its subtasks and blocks
 */
export async function getModuleWithContent(moduleId: number) {
	const module = await db.select().from(table.module).where(eq(table.module.id, moduleId)).limit(1);

	if (!module.length) {
		return null;
	}

	const subTasks = await db
		.select({
			subTask: table.moduleSubTask,
			task: table.task
		})
		.from(table.moduleSubTask)
		.innerJoin(table.task, eq(table.moduleSubTask.taskId, table.task.id))
		.where(eq(table.moduleSubTask.moduleId, moduleId))
		.orderBy(table.moduleSubTask.orderIndex);

	// Get blocks for each task
	const subTasksWithBlocks = await Promise.all(
		subTasks.map(async ({ subTask, task }) => {
			const blocks = await db
				.select()
				.from(table.taskBlock)
				.where(eq(table.taskBlock.taskId, task.id))
				.orderBy(table.taskBlock.index);

			return {
				...subTask,
				task,
				blocks
			};
		})
	);

	return {
		...module[0],
		subTasks: subTasksWithBlocks
	};
}

/**
 * Update module publication status
 */
export async function publishModule(moduleId: number, isPublished: boolean = true) {
	await db.update(table.module).set({ isPublished }).where(eq(table.module.id, moduleId));
}

/**
 * Delete a module and all its associated data
 */
export async function deleteModule(moduleId: number) {
	// Get all subtasks
	const subTasks = await db
		.select()
		.from(table.moduleSubTask)
		.where(eq(table.moduleSubTask.moduleId, moduleId));

	// Delete all associated tasks (cascades to blocks)
	for (const subTask of subTasks) {
		await db.delete(table.task).where(eq(table.task.id, subTask.taskId));
	}

	// Delete the module (cascades to subtasks)
	await db.delete(table.module).where(eq(table.module.id, moduleId));
}
