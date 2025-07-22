import { getTaskById, getTaskBlocksByTaskId, getSubjectOfferingClassTaskByTaskId } from '$lib/server/db/service';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load = async ({ locals: { security }, params: { taskId, subjectOfferingId, subjectOfferingClassId } }) => {
  const user = security.isAuthenticated().getUser();

  let taskIdInt;
  try {
    taskIdInt = parseInt(taskId, 10);
  } catch {
    throw redirect(302, '/dashboard');
  }

  const classIdInt = parseInt(subjectOfferingClassId, 10);
  if (isNaN(classIdInt)) {
    throw redirect(302, '/dashboard');
  }

  const task = await getTaskById(taskIdInt);
  if (!task) throw redirect(302, '/dashboard');

  // Get the class task to access status (needed for students)
  const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
  if (!classTask) throw redirect(302, '/dashboard');

  const blocks = await getTaskBlocksByTaskId(taskIdInt);

  // Check if there's already an active presentation for this task
  const presentationCheckResponse = await fetch(`${process.env.ORIGIN || 'http://localhost:5173'}/api/presentations?taskId=${taskIdInt}`);
  const presentationStatus = await presentationCheckResponse.json();

  return { 
    task, 
    classTask,
    blocks, 
    subjectOfferingId,
    subjectOfferingClassId, 
    user,
    isPresenting: presentationStatus.isActive || false
  };
};

export const actions: Actions = {
  start_presentation: async ({ locals: { security }, params: { taskId } }) => {
    const user = security.isAuthenticated().getUser();
    
    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    let taskIdInt;
    try {
      taskIdInt = parseInt(taskId, 10);
    } catch {
      return fail(400, { error: 'Invalid task ID' });
    }

    // Verify the task exists
    const task = await getTaskById(taskIdInt);
    if (!task) {
      return fail(404, { error: 'Task not found' });
    }

    // Check if user has permission to present (could add role check here)
    // For now, assuming authenticated users can present

    return {
      success: true,
      taskId: taskIdInt,
      teacherId: user.id,
      teacherName: `${user.firstName} ${user.lastName}`
    };
  },

  end_presentation: async ({ locals: { security }, params: { taskId } }) => {
    const user = security.isAuthenticated().getUser();
    
    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    let taskIdInt;
    try {
      taskIdInt = parseInt(taskId, 10);
    } catch {
      return fail(400, { error: 'Invalid task ID' });
    }

    return {
      success: true,
      taskId: taskIdInt,
      teacherId: user.id
    };
  }
};
