import { BASE_URL } from '@/lib/constants'
import { CourseThread } from '@/lib/types'
import { createFileRoute } from '@tanstack/react-router'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

async function fetchCourseThread(courseId: string, threadId: string) {
  const response = await fetch(
    `${BASE_URL}/app/courses/${courseId}/threads/${threadId}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  )
  const thread = (await response.json()) as CourseThread
  return thread
}

export const Route = createFileRoute(
  '/institutions/$institutionId/courses/$courseId/_layout/discussion/$threadId',
)({
  loader: ({ params }) => fetchCourseThread(params.courseId, params.threadId),
  component: DiscussionThread,
})

function DiscussionThread() {
  const thread = Route.useLoaderData() as CourseThread

  return (
    <article className="prose">
      <h1 className="text-4xl">{thread.title}</h1>
      <Markdown remarkPlugins={[remarkGfm]}>{thread.content}</Markdown>
    </article>
  )
}
