import { BASE_URL } from "@/lib/constants";
import { CourseThread } from "@/lib/types";
import { createFileRoute } from "@tanstack/react-router";

async function fetchCourseThread(courseId: string, threadId: string) {
  const response = await fetch(
    `${BASE_URL}/app/courses/${courseId}/threads/${threadId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  const thread = (await response.json()) as CourseThread;
  return thread;
}

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/discussion/$threadId"
)({
  loader: ({ params }) => fetchCourseThread(params.courseId, params.threadId),
  component: DiscussionThread,
});

function DiscussionThread() {
  const thread = Route.useLoaderData() as CourseThread;

  return (
    <article className="prose">
      <h1>{thread.title}</h1>
      <p>{thread.content}</p>
    </article>
  );
}
