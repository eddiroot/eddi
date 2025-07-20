import { browser } from '$app/environment';

// Debounced save function for auto-saving user responses
export function createDebouncedSave(
	saveFunction: (response: unknown) => Promise<void>,
	delay: number = 1000
) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return (response: unknown) => {
		if (!browser) return;

		// Clear existing timeout
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		// Set new timeout
		timeoutId = setTimeout(async () => {
			try {
				await saveFunction(response);
			} catch (error) {
				console.error('Auto-save failed:', error);
				// Could show a subtle toast notification here
			}
		}, delay);
	};
}

// Save response to server
export async function saveTaskBlockResponse(
	taskBlockId: number,
	classTaskId: number,
	response: unknown
) {
	if (!browser) return;

	const url = `/api/tasks/responses`;
	
	const result = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			taskBlockId,
			classTaskId,
			response
		})
	});

	if (!result.ok) {
		throw new Error('Failed to save response');
	}

	return result.json();
}

// Load existing response from server
export async function loadExistingResponse(
	taskBlockId: number,
	taskId: number,
	subjectOfferingClassId: number
) {
	if (!browser) return null;

	const url = `/api/tasks/responses/${taskBlockId}?taskId=${taskId}&subjectOfferingClassId=${subjectOfferingClassId}`;
	
	try {
		const result = await fetch(url);
		if (!result.ok) {
			if (result.status === 404) {
				// No response found yet - this is normal
				return null;
			}
			throw new Error('Failed to load response');
		}
		
		const data = await result.json();
		return data.response?.response || null;
	} catch (error) {
		console.error('Error loading existing response:', error);
		return null;
	}
}
