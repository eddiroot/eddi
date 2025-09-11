import { json } from '@sveltejs/kit';
import { deleteTimetableConstraint } from '$lib/server/db/service/timetables';

// // Update a constraint (toggle active state or update parameters)
// export const PATCH = async ({ request, params, locals: { security } }) => {
// 	security.isAuthenticated().isSchoolAdmin().getUser();
// 	const timetableId = parseInt(params.timetableId);
// 	const constraintId = parseInt(params.constraintId);
	
// 	try {
// 		const { active, parameters } = await request.json();
		
// 		// For now, we're just implementing the toggle functionality
// 		// In a full implementation, you'd update the constraint parameters in a separate table
		
// 		return json({ 
// 			success: true,
// 			message: 'Constraint updated successfully'
// 		});
// 	} catch (error) {
// 		console.error('Error updating constraint:', error);
// 		return json({ 
// 			success: false, 
// 			error: 'Failed to update constraint' 
// 		}, { status: 500 });
// 	}
// };

// Remove a constraint from a timetable
export const DELETE = async ({ params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);
	const constraintId = parseInt(params.constraintId);
	
	try {
		await deleteTimetableConstraint(timetableId, constraintId);
		
		return json({ success: true });
	} catch (error) {
		console.error('Error removing constraint:', error);
		return json({ 
			success: false, 
			error: 'Failed to remove constraint' 
		}, { status: 500 });
	}
};
