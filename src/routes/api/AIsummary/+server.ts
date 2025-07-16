import { json, type RequestHandler } from '@sveltejs/kit';
// api/AIsummary/+server.ts
import { getSubjectThreadById, getSubjectThreadResponsesById } from '$lib/server/db/service';

export const POST: RequestHandler = async (event) => {
  const { threadId } = await event.request.json();
  
  const thread = await getSubjectThreadById(threadId);
  const responses = await getSubjectThreadResponsesById(threadId);
  
  const answers = responses.filter(r => r.response.type === 'answer' && !r.response.parentResponseId);
  const comments = responses.filter(r => r.response.type === 'comment' && !r.response.parentResponseId);
  
  
};