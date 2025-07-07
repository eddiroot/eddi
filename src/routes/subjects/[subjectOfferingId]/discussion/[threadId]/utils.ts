import type { SubjectThreadResponse } from '$lib/server/db/schema';

export function getNestedResponses(
	allResponses: {
		response: SubjectThreadResponse;
		user: {
			firstName: string;
			middleName: string | null;
			lastName: string;
			avatarUrl: string | null;
		};
	}[]
) {
	const responseMap = new Map();
	const topLevelResponses = [];

	for (const response of allResponses) {
		responseMap.set(response.response.id, {
			...response,
			replies: []
		});
	}

	for (const response of allResponses) {
		if (response.response?.parentResponseId) {
			const parent = responseMap.get(response.response.parentResponseId);
			if (parent) {
				parent.replies.push(responseMap.get(response.response.id));
			}
		} else {
			topLevelResponses.push(responseMap.get(response.response.id));
		}
	}

	return topLevelResponses;
}

export function getThreadTypeDisplay(type: string): string {
	switch (type) {
		case 'discussion':
			return 'Discussion';
		case 'question':
			return 'Question';
		case 'announcement':
			return 'Announcement';
		case 'qanda':
			return 'Q&A';
		default:
			return 'Thread';
	}
}

export function getResponseTypeDescription(type: string): string {
	switch (type) {
		case 'answer':
			return 'Provide a helpful answer to solve this question';
		case 'comment':
			return 'Share your thoughts or ask for clarification';
		default:
			return '';
	}
}
