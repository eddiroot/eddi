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

If a student asks about their subjects, tasks, or assignments, you can provide information and help them organize their learning. Always focus on helping them understand concepts rather than just completing tasks.
`;

export interface TaskContextItem {
	taskTopicName: string;
	taskTitle: string;
	taskBlock: {
		id: number;
		taskId: number;
		type: string;
		content: unknown;
		index: number;
		createdAt: string;
		updatedAt: string;
	} | null;
}

export function createContextualSystemInstruction(taskContexts: TaskContextItem[]): string {
	let contextInfo = '';

	if (taskContexts && taskContexts.length > 0) {
		// Group tasks by topic
		const topicMap = new Map<
			string,
			{
				tasks: Map<
					string,
					{
						title: string;
						blocks: TaskContextItem['taskBlock'][];
					}
				>;
			}
		>();

		// Organize the data by topic and task
		taskContexts.forEach((context) => {
			if (!topicMap.has(context.taskTopicName)) {
				topicMap.set(context.taskTopicName, {
					tasks: new Map()
				});
			}

			const topic = topicMap.get(context.taskTopicName)!;
			if (!topic.tasks.has(context.taskTitle)) {
				topic.tasks.set(context.taskTitle, {
					title: context.taskTitle,
					blocks: []
				});
			}

			// Only add the block if it exists (not null from LEFT JOIN)
			if (context.taskBlock) {
				topic.tasks.get(context.taskTitle)!.blocks.push(context.taskBlock);
			}
		});

		contextInfo += "\n\n=== STUDENT'S CURRENT SUBJECT LESSONS ===\n";
		contextInfo += 'IMPORTANT: Use this information to help students find relevant tasks!\n\n';

		topicMap.forEach((topicData, topicName) => {
			contextInfo += `TOPIC: ${topicName}\n`;

			topicData.tasks.forEach((taskData, taskTitle) => {
				contextInfo += `  LESSON: "${taskTitle}"\n`;

				// Process task blocks and extract useful content
				const blockSummary = processTaskBlocks(taskData.blocks);
				if (blockSummary.length > 0) {
					contextInfo += `     Content: ${blockSummary}\n`;
				} else {
					contextInfo += `     Content: No content blocks yet\n`;
				}
			});
			contextInfo += '\n';
		});

		contextInfo += '=== END LESSON CONTEXT ===\n';
		contextInfo +=
			'When students ask about topics, ALWAYS check the tasks above and reference specific task titles!\n';
	}

	return systemInstructionChatbot + contextInfo;
}

function processTaskBlocks(blocks: TaskContextItem['taskBlock'][]): string {
	const contentSummary: string[] = [];

	blocks.forEach((block) => {
		if (!block) return;

		const blockType = block.type;

		try {
			const content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;

			switch (blockType) {
				case 'multipleChoice':
					if (content && content.question) {
						contentSummary.push(`Question: "${content.question}"`);
						// Also include options for more context
						if (content.options && Array.isArray(content.options)) {
							const optionTexts = content.options
								.slice(0, 2)
								.map((opt: unknown) => {
									if (typeof opt === 'object' && opt !== null && 'text' in opt) {
										return (opt as { text: string }).text;
									}
									return String(opt);
								})
								.join(', ');
							contentSummary.push(`Options: ${optionTexts}...`);
						}
					}
					break;

				case 'markdown':
				case 'text':
					if (typeof content === 'string' && content.length > 0) {
						// Extract key terms and truncate long text content
						const truncated = content.length > 200 ? content.substring(0, 200) + '...' : content;
						contentSummary.push(`Text: "${truncated}"`);
					}
					break;

				case 'h1':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
					if (typeof content === 'string' && content.length > 0) {
						contentSummary.push(`HEADING: "${content}"`);
					}
					break;

				case 'image':
					if (content && content.alt) {
						contentSummary.push(`Image: ${content.alt}`);
					} else if (content && content.caption) {
						contentSummary.push(`Image: ${content.caption}`);
					} else {
						contentSummary.push('Image content');
					}
					break;

				case 'video':
					if (content && content.title) {
						contentSummary.push(`Video: ${content.title}`);
					} else {
						contentSummary.push('Video content');
					}
					break;

				case 'audio':
					if (content && content.title) {
						contentSummary.push(`Audio: ${content.title}`);
					} else {
						contentSummary.push('Audio content');
					}
					break;

				case 'whiteboard':
					if (content && content.title) {
						contentSummary.push(`Interactive whiteboard: ${content.title}`);
					} else {
						contentSummary.push('Interactive whiteboard activity');
					}
					break;

				default:
					contentSummary.push(`${blockType} content`);
			}
		} catch {
			// If content parsing fails, just note the block type
			contentSummary.push(`${blockType} content`);
		}
	});

	return contentSummary.join(', ');
}
