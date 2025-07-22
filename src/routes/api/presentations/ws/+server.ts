import type { Socket, Peer } from './$types.js';
// In-memory storage for active presentations and student answers
const activePresentations = new Map<string, {
	taskId: string;
	teacherId: string;
	startTime: Date;
	studentAnswers: Map<string, {
		questionId: string;
		answer: string;
		studentId: string;
		studentName?: string;
		slideIndex: number;
		timestamp: Date;
	}>;
}>();

// Store peer connections with their presentation context
const peerPresentations = new Map<Peer, {
	presentationKey?: string;
	role?: 'teacher' | 'student';
	userId?: string;
	userName?: string;
}>();

export const socket: Socket = {
	async open(peer) {
		console.log('Client connected to presentations WebSocket');
		peerPresentations.set(peer, {});
	},

	async message(peer, message) {
		const parsedMessage = JSON.parse(String(message));
		const { type } = parsedMessage;

		switch (type) {
			case 'start_presentation':
				await handleStartPresentation(peer, parsedMessage);
				break;

			case 'join_presentation':
				await handleJoinPresentation(peer, parsedMessage);
				break;

			case 'submit_answer':
				await handleSubmitAnswer(peer, parsedMessage);
				break;

			case 'end_presentation':
				await handleEndPresentation(peer, parsedMessage);
				break;

			case 'clear_question_answers':
				await handleClearQuestionAnswers(peer, parsedMessage);
				break;

			case 'slide_changed':
				await handleSlideChanged(peer, parsedMessage);
				break;

			default:
				peer.send(JSON.stringify({
					type: 'error',
					message: `Unknown message type: ${type}`
				}));
		}
	},

	async close(peer) {
		console.log('Client disconnected from presentations WebSocket');
		
		const peerData = peerPresentations.get(peer);
		if (peerData?.presentationKey) {
			// If this was a teacher, end the presentation
			if (peerData.role === 'teacher') {
				const presentation = activePresentations.get(peerData.presentationKey);
				if (presentation && presentation.teacherId === peerData.userId) {
					// Notify all participants that presentation has ended
					peer.publish(`presentation-${peerData.presentationKey}`, JSON.stringify({
						type: 'presentation_ended',
						taskId: presentation.taskId
					}));
					
					// Remove from active presentations
					activePresentations.delete(peerData.presentationKey);
				}
			}
		}
		
		peerPresentations.delete(peer);
	}
};

async function handleStartPresentation(peer: Peer, data: { taskId: string; teacherId: string; teacherName?: string }) {
	const { taskId, teacherId, teacherName } = data;
	const presentationKey = `presentation_${taskId}`;
	
	// Create or update presentation
	activePresentations.set(presentationKey, {
		taskId,
		teacherId,
		startTime: new Date(),
		studentAnswers: new Map()
	});

	// Update peer data
	peerPresentations.set(peer, {
		presentationKey,
		role: 'teacher',
		userId: teacherId,
		userName: teacherName
	});

	// Subscribe to presentation updates
	peer.subscribe(`presentation-${presentationKey}`);
	
	// Notify all clients that presentation has started
	peer.publish(`presentation-${presentationKey}`, JSON.stringify({
		type: 'presentation_started',
		taskId,
		teacherId,
		teacherName
	}));

	// Confirm to teacher
	peer.send(JSON.stringify({
		type: 'presentation_started',
		taskId,
		presentationKey
	}));
	
	console.log(`Presentation started for task ${taskId} by teacher ${teacherId}`);
}

async function handleJoinPresentation(peer: Peer, data: { taskId: string; studentId: string; studentName?: string }) {
	const { taskId, studentId, studentName } = data;
	const presentationKey = `presentation_${taskId}`;
	
	// Check if presentation is active
	const presentation = activePresentations.get(presentationKey);
	if (!presentation) {
		peer.send(JSON.stringify({
			type: 'presentation_not_found',
			taskId
		}));
		return;
	}

	// Update peer data
	peerPresentations.set(peer, {
		presentationKey,
		role: 'student',
		userId: studentId,
		userName: studentName
	});

	// Subscribe to presentation updates
	peer.subscribe(`presentation-${presentationKey}`);
	
	// Send existing answers to the joining student
	const answers = Array.from(presentation.studentAnswers.values());
	peer.send(JSON.stringify({
		type: 'presentation_state',
		answers
	}));

	// Notify teacher about new student
	peer.publish(`presentation-${presentationKey}`, JSON.stringify({
		type: 'student_joined',
		studentId,
		studentName
	}));

	// Confirm to student
	peer.send(JSON.stringify({
		type: 'joined_presentation',
		taskId,
		presentationKey
	}));
	
	console.log(`Student ${studentId} joined presentation for task ${taskId}`);
}

async function handleSubmitAnswer(peer: Peer, data: { 
	taskId: string; 
	questionId: string; 
	answer: string; 
	studentId: string;
	studentName?: string;
	slideIndex?: number;
}) {
	const { taskId, questionId, answer, studentId, studentName, slideIndex } = data;
	const presentationKey = `presentation_${taskId}`;
	
	const presentation = activePresentations.get(presentationKey);
	if (!presentation) {
		peer.send(JSON.stringify({
			type: 'error',
			message: 'Presentation not found'
		}));
		return;
	}

	// Store the answer (overwrites previous answer from same student for same question)
	const answerKey = `${studentId}_${questionId}`;
	const answerData = {
		questionId,
		answer,
		studentId,
		studentName,
		slideIndex: slideIndex ?? 0,
		timestamp: new Date()
	};
	presentation.studentAnswers.set(answerKey, answerData);

	// Broadcast the answer to all participants (especially the teacher)
	peer.publish(`presentation-${presentationKey}`, JSON.stringify({
		type: 'new_answer',
		...answerData
	}));

	// Confirm to student
	peer.send(JSON.stringify({
		type: 'answer_submitted',
		questionId,
		timestamp: answerData.timestamp
	}));

	console.log(`Answer submitted by ${studentId} for question ${questionId} in task ${taskId}`);
}

async function handleEndPresentation(peer: Peer, data: { taskId: string; teacherId: string }) {
	const { taskId, teacherId } = data;
	const presentationKey = `presentation_${taskId}`;
	
	const presentation = activePresentations.get(presentationKey);
	if (!presentation || presentation.teacherId !== teacherId) {
		peer.send(JSON.stringify({
			type: 'error',
			message: 'Unauthorized to end presentation'
		}));
		return;
	}

	// Notify all participants that presentation has ended
	peer.publish(`presentation-${presentationKey}`, JSON.stringify({
		type: 'presentation_ended',
		taskId
	}));
	
	// Remove from active presentations
	activePresentations.delete(presentationKey);
	
	console.log(`Presentation ended for task ${taskId} by teacher ${teacherId}`);
}

async function handleClearQuestionAnswers(peer: Peer, data: { taskId: string; questionId: string; teacherId: string }) {
	const { taskId, questionId, teacherId } = data;
	const presentationKey = `presentation_${taskId}`;
	
	const presentation = activePresentations.get(presentationKey);
	if (!presentation || presentation.teacherId !== teacherId) {
		peer.send(JSON.stringify({
			type: 'error',
			message: 'Unauthorized to clear answers'
		}));
		return;
	}

	// Remove all answers for this question
	for (const [key, answer] of presentation.studentAnswers.entries()) {
		if (answer.questionId === questionId) {
			presentation.studentAnswers.delete(key);
		}
	}

	// Notify all participants
	peer.publish(`presentation-${presentationKey}`, JSON.stringify({
		type: 'question_answers_cleared',
		questionId
	}));
	
	console.log(`Answers cleared for question ${questionId} in task ${taskId}`);
}

async function handleSlideChanged(peer: Peer, data: { taskId: string; slideIndex: number; teacherId: string }) {
	const { taskId, slideIndex, teacherId } = data;
	const presentationKey = `presentation_${taskId}`;
	
	// Verify that the presentation exists and this is the teacher
	const presentation = activePresentations.get(presentationKey);
	if (!presentation || presentation.teacherId !== teacherId) {
		peer.send(JSON.stringify({
			type: 'error',
			message: 'Unauthorized or presentation not found'
		}));
		return;
	}
	
	// Update peer data to indicate this is the teacher
	const peerData = peerPresentations.get(peer);
	if (peerData) {
		peerData.presentationKey = presentationKey;
		peerData.role = 'teacher';
		peerData.userId = teacherId;
	}
	
	// Broadcast slide change to all students in the presentation
	peer.publish(`presentation-${presentationKey}`, JSON.stringify({
		type: 'slide_changed',
		taskId,
		slideIndex,
		teacherId
	}));
	
	console.log(`Teacher ${teacherId} changed slide to ${slideIndex} in task ${taskId}`);
}

// Export function to check if presentation is active (for the API endpoint)
export function _isPresent(taskId: string) {
	const presentationKey = `presentation_${taskId}`;
	return activePresentations.has(presentationKey);
}

// Export function to get presentation data (for the API endpoint)
export function _getPresentationData(taskId: string) {
	const presentationKey = `presentation_${taskId}`;
	const presentation = activePresentations.get(presentationKey);
	
	if (!presentation) return null;
	
	return {
		taskId: presentation.taskId,
		teacherId: presentation.teacherId,
		startTime: presentation.startTime,
		answerCount: presentation.studentAnswers.size
	};
}
