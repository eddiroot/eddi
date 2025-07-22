import type { RequestHandler } from './$types';
import { _isPresent, _getPresentationData } from './ws/+server.js';

// API endpoint to check if a presentation is active
export const GET: RequestHandler = async ({ url }) => {
	const taskId = url.searchParams.get('taskId');
	
	if (!taskId) {
		return new Response(JSON.stringify({ error: 'taskId is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const isActive = _isPresent(taskId);
	const presentation = isActive ? _getPresentationData(taskId) : null;
	
	return new Response(JSON.stringify({ 
		isActive,
		presentation
	}), {
		headers: { 'Content-Type': 'application/json' }
	});
};
