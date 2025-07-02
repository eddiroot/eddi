export const systemInstructionChatbot = `
You are eddi, a helpful academic tutor and study companion. Your goal is to guide students toward solving their homework problems on their own. 

STUDENT CONTEXT:
- You have access to information about the student's current lessons, topics, and lesson content. 
- Use this context to provide more relevant and personalised guidance.
- Always check the lessons above and reference specific lesson titles when students ask about topics.

CORE PRINCIPLES:
- Never provide direct answers to homework problems
- Break down problems into smaller, manageable steps
- Ask leading questions to help students think critically
- Use examples only if they do not solve the original question directly
- If the user insists on the answer, politely remind them that your goal is to help them learn
- Look over the provided context before answering questions and point students to relevant lesson content

CONVERSATION STYLE:
- Be encouraging and supportive
- Reference their specific lessons and topics when relevant
- Help them connect new problems to concepts they've already learned in their lessons
- Use the lesson content to guide your explanations and examples
- Celebrate their progress and understanding

If a student asks about their subjects, lessons, or assignments, you can provide information and help them organize their learning. Always focus on helping them understand concepts rather than just completing tasks.
`;

export interface LessonContextItem {
    lessonTopicName: string;
    lessonTitle: string;
    lessonBlock: {
        id: number;
        lessonId: number;
        type: string;
        content: unknown;
        index: number;
        createdAt: string;
        updatedAt: string;
    } | null;
}

export function createContextualSystemInstruction(lessonContexts: LessonContextItem[]): string {
    let contextInfo = '';

    if (lessonContexts && lessonContexts.length > 0) {
        // Group lessons by topic
        const topicMap = new Map<string, {
            lessons: Map<string, {
                title: string;
                blocks: LessonContextItem['lessonBlock'][];
            }>;
        }>();

        // Organize the data by topic and lesson
        lessonContexts.forEach((context) => {
            if (!topicMap.has(context.lessonTopicName)) {
                topicMap.set(context.lessonTopicName, {
                    lessons: new Map()
                });
            }

            const topic = topicMap.get(context.lessonTopicName)!;
            if (!topic.lessons.has(context.lessonTitle)) {
                topic.lessons.set(context.lessonTitle, {
                    title: context.lessonTitle,
                    blocks: []
                });
            }

            // Only add the block if it exists (not null from LEFT JOIN)
            if (context.lessonBlock) {
                topic.lessons.get(context.lessonTitle)!.blocks.push(context.lessonBlock);
            }
        });

        contextInfo += '\n\n=== STUDENT\'S CURRENT SUBJECT LESSONS ===\n';
        contextInfo += 'IMPORTANT: Use this information to help students find relevant lessons!\n\n';

        topicMap.forEach((topicData, topicName) => {
            contextInfo += `TOPIC: ${topicName}\n`;

            topicData.lessons.forEach((lessonData, lessonTitle) => {
                contextInfo += `  LESSON: "${lessonTitle}"\n`;

                // Process lesson blocks and extract useful content
                const blockSummary = processLessonBlocks(lessonData.blocks);
                if (blockSummary.length > 0) {
                    contextInfo += `     Content: ${blockSummary}\n`;
                } else {
                    contextInfo += `     Content: No content blocks yet\n`;
                }
            });
            contextInfo += '\n';
        });

        contextInfo += '=== END LESSON CONTEXT ===\n';
        contextInfo += 'When students ask about topics, ALWAYS check the lessons above and reference specific lesson titles!\n';
    }

    return systemInstructionChatbot + contextInfo;
}

function processLessonBlocks(blocks: LessonContextItem['lessonBlock'][]): string {
    const contentSummary: string[] = [];

    blocks.forEach((block) => {
        // Skip null blocks (from LEFT JOIN)
        if (!block) return;

        const blockType = block.type;

        try {
            // Parse the JSON content
            const content = typeof block.content === 'string'
                ? JSON.parse(block.content)
                : block.content;

            switch (blockType) {
                case 'multipleChoice':
                    if (content && content.question) {
                        contentSummary.push(`Question: "${content.question}"`);
                        // Also include options for more context
                        if (content.options && Array.isArray(content.options)) {
                            const optionTexts = content.options.slice(0, 2).map((opt: unknown) => {
                                if (typeof opt === 'object' && opt !== null && 'text' in opt) {
                                    return (opt as { text: string }).text;
                                }
                                return String(opt);
                            }).join(', ');
                            contentSummary.push(`Options: ${optionTexts}...`);
                        }
                    }
                    break;

                case 'markdown':
                case 'text':
                    if (typeof content === 'string' && content.length > 0) {
                        // Extract key terms and truncate long text content
                        const truncated = content.length > 200
                            ? content.substring(0, 200) + '...'
                            : content;
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
