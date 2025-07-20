import { json } from '@sveltejs/kit';
import { getTaskBlockResponse, getSubjectOfferingClassTaskByTaskId } from '$lib/server/db/service';

export async function GET({ locals: { security }, url, params }) {
	try {
		const user = security.isAuthenticated().getUser();
		const taskBlockId = params.taskBlockId;
		const taskId = url.searchParams.get('taskId');
		const subjectOfferingClassId = url.searchParams.get('subjectOfferingClassId');
		
		if (!taskBlockId || !taskId || !subjectOfferingClassId) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);
		const blockIdInt = parseInt(taskBlockId, 10);

		// Get the class task to get the classTaskId
		const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
		if (!classTask) {
			return json({ error: 'Class task not found' }, { status: 404 });
		}

		// Get the user's response for this block
		const response = await getTaskBlockResponse(blockIdInt, user.id, classTask.id);
		
		return json({ response });
	} catch (error) {
		console.error('Error loading task block response:', error);
		return json({ error: 'Failed to load response' }, { status: 500 });
	}
}
