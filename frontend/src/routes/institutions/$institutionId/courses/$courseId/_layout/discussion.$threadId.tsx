import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BASE_URL } from "@/lib/constants";
import { CourseThread } from "@/lib/types";
import { createFileRoute } from "@tanstack/react-router";
import {
  Ellipsis,
  MessageSquareTextIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
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
        <article className="prose dark:prose-invert">
          <h1 className="text-4xl">{thread.title}</h1>
          <Markdown remarkPlugins={[remarkGfm]}>{thread.content}</Markdown>
        </article>
        <div className="flex gap-2">
          <Button variant="secondary">Comment</Button>
          <Button variant="ghost" size="icon">
            <Ellipsis />
          </Button>
        </div>
        <Separator />
        <div className="ml-8 space-y-3">
          <Comment
            author="Jon Snow"
            content="This is a comment on the main question. It is in the frontend and
              not pulled from the API."
            replies={[
              {
                author: "Harry Potter",
                content: "A nested comment by Mr Potter.",
              },
            ]}
          />
          <Comment
            author="Harry Potter"
            content="Another comment on the main question."
          />
        </div>
      </div>
      <Card className="min-h-44">
        <CardHeader>
          <strong>Lightning McQueen</strong>
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
      <div className="space-y-4">
        <h2 className="text-xl">Your answer</h2>
        <Textarea className="min-h-40" placeholder="Start typing..." />
        <Button>Send</Button>
      </div>
    </div>
  );
}

type CommentType = {
  author: string;
  content: string;
  replies?: CommentType[];
};

function Comment({ author, content, replies }: CommentType) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p>
          <strong>{author}</strong>
        </p>
        <p>{content}</p>
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
        {replies?.map(({ author, content, replies }, idx) => (
          <Comment
            key={idx}
            author={author}
            content={content}
            replies={replies}
          />
        ))}
      </div>
    </div>
  );
}
