import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BASE_URL } from "@/lib/constants";
import { CourseThreadWithResponses, CourseThreadResponse } from "@/lib/types";
import { createFileRoute } from "@tanstack/react-router";
import {
  Ellipsis,
  MessageSquareTextIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

async function fetchCourseThread(courseId: string, threadId: string) {
  const response = await fetch(
    `${BASE_URL}/app/course/${courseId}/thread/${threadId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  const thread = (await response.json()) as CourseThreadWithResponses;
  return thread;
}

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/discussion/$threadId"
)({
  loader: ({ params }) => fetchCourseThread(params.courseId, params.threadId),
  component: CourseThread,
});

function CourseThread() {
  const thread = Route.useLoaderData() as CourseThreadWithResponses;

  return (
    <div className="space-y-8 w-full">
      <div className="space-y-4">
        <article className="prose dark:prose-invert max-w-none">
          <h1 className="text-4xl">{thread.Title}</h1>
          <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {thread.Content}
          </Markdown>
        </article>
        <div className="flex gap-2">
          <Button variant="secondary">Comment</Button>
          <Button variant="ghost" size="icon">
            <Ellipsis />
          </Button>
        </div>
        <Separator />
        <div className="ml-8 space-y-3">
          {thread.Responses?.filter(
            (response) => response.Type == "comment"
          ).map((response, idx) => (
            <ThreadResponse key={idx} response={response} />
          ))}
        </div>
      </div>
      {thread.Responses?.filter((response) => response.Type == "answer").map(
        (response, idx) => (
          <Card key={idx} className="min-h-44">
            <CardHeader>
              <strong>Author: {response.UserId}</strong>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>This is an answer to the main question.</p>
              <div className="flex gap-2">
                <Button variant="secondary">Comment</Button>
                <Button variant="ghost" size="icon">
                  <Ellipsis />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      )}
      <div className="space-y-4">
        <h2 className="text-xl">Your answer</h2>
        <Textarea className="min-h-40" placeholder="Start typing..." />
        <Button>Send</Button>
      </div>
    </div>
  );
}

function ThreadResponse({ response }: { response: CourseThreadResponse }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p>
          <strong>Author: {response.UserId}</strong>
          <strong>Type: {response.Type}</strong>
        </p>
        <p>{response.Content}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <ThumbsUpIcon />
          </Button>
          <Button variant="ghost" size="icon">
            <ThumbsDownIcon />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageSquareTextIcon />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-l-2 pl-10">
        {response.Responses?.map((responseInner, idx) => (
          <ThreadResponse key={idx} response={responseInner} />
        ))}
      </div>
    </div>
  );
}
