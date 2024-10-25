import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BASE_URL } from "@/lib/constants";
import { CourseThread } from "@/lib/types";
import { createFileRoute } from "@tanstack/react-router";
import { Ellipsis } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  "/institutions/$institutionId/courses/$courseId/_layout/discussion/$threadId"
)({
  loader: ({ params }) => fetchCourseThread(params.courseId, params.threadId),
  component: DiscussionThread,
});

function DiscussionThread() {
  const thread = Route.useLoaderData() as CourseThread;

  return (
    <div className="space-y-8 w-full">
      <div className="space-y-4">
        <article className="prose">
          <h1 className="text-4xl">{thread.title}</h1>
          <Markdown remarkPlugins={[remarkGfm]}>{thread.content}</Markdown>
        </article>
        <div className="flex gap-2">
          <Button variant="secondary">Comment</Button>
          <Button variant="ghost" size="icon">
            <Ellipsis />
          </Button>
        </div>
        <div className="ml-8 space-y-2">
          <Card>
            <CardHeader>Jon Snow</CardHeader>
            <CardContent>This is a comment on the main question.</CardContent>
          </Card>
          <Card>
            <CardHeader>Harry Potter</CardHeader>
            <CardContent>Another comment on the main question.</CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>Lightning McQueen</CardHeader>
        <CardContent>This is an answer to the main question.</CardContent>
      </Card>
      <div className="space-y-2">
        <h2 className="text-xl">Your answer</h2>
        <Textarea placeholder="Start typing..." />
        <Button>Send</Button>
      </div>
    </div>
  );
}
