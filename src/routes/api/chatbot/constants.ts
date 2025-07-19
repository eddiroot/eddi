export const systemInstructionChatbot = `
You are eddi, a helpful academic tutor and study companion. Your goal is to guide students toward solving their homework problems on their own. 

STUDENT CONTEXT:
- You have access to information about the student's current tasks, topics, and task content. 
- Use this context to provide more relevant and personalised guidance.
- Always check the tasks above and reference specific task titles when students ask about topics.

CORE PRINCIPLES:
- Never provide direct answers to homework problems
- Break down problems into smaller, manageable steps
- Ask leading questions to help students think critically
- Use examples only if they do not solve the original question directly
- If the user insists on the answer, politely remind them that your goal is to help them learn
- Look over the provided context before answering questions and point students to relevant task content

CONVERSATION STYLE:
- Be encouraging and supportive
- Reference their specific tasks and topics when relevant
- Help them connect new problems to concepts they've already learned in their tasks
- Use the task content to guide your explanations and examples
- Celebrate their progress and understanding

If a student asks about their subjects, tasks, or assignments, you can provide information and help them organise their learning. Always focus on helping them understand concepts rather than just completing tasks.
`;

export interface CourseMapItem {
	id: number;
	topic: string;
	description: string | null;
	learningAreas: Array<{
		id: number;
		name: string;
		description: string | null;
	}>;
}

export interface TaskItem {
	id: number;
	name: string;
	description: string | null;
	index?: number;
	subjectOfferingClassTaskId: number;
	courseMapItemId: number | null;
	courseMapItemTopic: string | null;
}

export interface SubjectContextData {
	subjectInfo: {
		id: number;
		name: string;
		yearLevel: string;
	};
	courseMapItems: CourseMapItem[];
	tasks: TaskItem[];
}

export function createContextualSystemInstruction(
	subjectContext: SubjectContextData | null
): string {
	let contextInfo = '';

	if (
		subjectContext &&
		(subjectContext.courseMapItems.length > 0 || subjectContext.tasks.length > 0)
	) {
		contextInfo += "\n\n=== STUDENT'S CURRENT SUBJECT CONTENT ===\n";
		contextInfo +=
			'IMPORTANT: Use this information to help students find relevant tasks and topics!\n\n';

		// Subject Information
		contextInfo += `SUBJECT: ${subjectContext.subjectInfo.name}\n`;
		contextInfo += `Year Level: ${subjectContext.subjectInfo.yearLevel}\n\n`;

		// Course Map Items (Topics)
		if (subjectContext.courseMapItems.length > 0) {
			contextInfo += 'COURSE TOPICS:\n';
			subjectContext.courseMapItems.forEach((item) => {
				contextInfo += `  TOPIC: "${item.topic}"\n`;
				if (item.description) {
					contextInfo += `    Description: ${item.description}\n`;
				}

				// Learning Areas for this topic
				if (item.learningAreas.length > 0) {
					contextInfo += `    Learning Areas: ${item.learningAreas.map((la) => la.name).join(', ')}\n`;
				}

				// Find tasks related to this course map item
				const relatedTasks = subjectContext.tasks.filter(
					(task) => task.courseMapItemId === item.id
				);
				if (relatedTasks.length > 0) {
					contextInfo += `    Related Tasks:\n`;
					relatedTasks.forEach((task) => {
						contextInfo += `      - "${task.name}"${task.description ? `: ${task.description}` : ''}\n`;
					});
				}
				contextInfo += '\n';
			});
		}

		// All Available Tasks
		if (subjectContext.tasks.length > 0) {
			contextInfo += 'ALL AVAILABLE TASKS:\n';
			subjectContext.tasks
				.sort((a, b) => (a.index || 0) - (b.index || 0))
				.forEach((task) => {
					contextInfo += `  TASK: "${task.name}"\n`;
					if (task.description) {
						contextInfo += `    Description: ${task.description}\n`;
					}
					if (task.courseMapItemTopic) {
						contextInfo += `    Related Topic: ${task.courseMapItemTopic}\n`;
					}
					contextInfo += `    Task ID: ${task.id}\n\n`;
				});
		}

		contextInfo += '=== END SUBJECT CONTEXT ===\n';
		contextInfo +=
			'When students ask about topics or need help, ALWAYS reference the specific topics and tasks above!\n';
		contextInfo +=
			'You can direct students to specific tasks by mentioning their names and descriptions.\n';
	}

	return systemInstructionChatbot + contextInfo;
}
