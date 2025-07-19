// api/AIsummary/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { getSubjectThreadById, getSubjectThreadResponsesById } from '$lib/server/db/service';
import { generateThreadSummary } from '$lib/server/ai/index';

export const POST: RequestHandler = async (event) => {
  try {
    const { threadId } = await event.request.json();

    const user = event.locals.security.getUser();
    if (!user) {
      return json({ error: 'Unauthorised' }, { status: 401 });
    }

    const thread = await getSubjectThreadById(threadId);
    const responses = await getSubjectThreadResponsesById(threadId);

    if (!thread) {
      return json({ error: 'Thread not found' }, { status: 404 });
    }

    const answers = responses.filter(r => r.response.type === 'answer' && !r.response.parentResponseId);
    const comments = responses.filter(r => r.response.type === 'comment' && !r.response.parentResponseId);

    const summary = await generateThreadSummary(thread, answers, comments);

    return json({ summary });

  } catch (error) {
    console.error('Error generating summary:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};