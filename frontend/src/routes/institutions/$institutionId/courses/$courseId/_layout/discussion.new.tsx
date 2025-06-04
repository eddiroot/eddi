import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MessageSquareTextIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/discussion/new"
)({
  component: CreateThread,
});

type ThreadType = {
  title: string;
  type: "Question" | "Post";
  content: string;
};

function CreateThread() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { institutionId, courseId } = Route.useParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ThreadType>({
    defaultValues: {
      type: "Question",
    },
  });

  const type = watch("type");
  const content = watch("content");

  if (!user) return <p>Need to be signed in to view this page...</p>;

  const onSubmit = async ({ title, type, content }: ThreadType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/app/course/${courseId}/thread`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.ID,
            courseId: parseInt(courseId),
            title,
            type,
            content,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const body = await response.json();
        navigate({
          to: "/institutions/$institutionId/courses/$courseId/discussion/$threadId",
          params: { institutionId, courseId, threadId: body.id },
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      <div className="flex justify-between h-10 items-center">
        <h2 className="text-xl font-bold">New {type}</h2>
        <div className="flex gap-2 items-center">
          <Link
            className={buttonVariants({ variant: "link" })}
            to="/institutions/$institutionId/courses/$courseId/discussion"
            params={{ institutionId, courseId }}
          >
            Cancel
          </Link>
          <Button type="submit">Post</Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className={`w-1/2 ${type === "Question" ? "bg-purple-500 hover:bg-purple-500 text-white" : ""}`}
            onClick={() => setValue("type", "Question")}
          >
            <QuestionMarkCircledIcon /> Question
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={`w-1/2 ${type === "Post" ? "bg-blue-500 hover:bg-blue-500 text-white" : ""}`}
            onClick={() => setValue("type", "Post")}
          >
            <MessageSquareTextIcon />
            Post
          </Button>
        </div>
        {errors.type && <p className="text-red-600">{errors.type.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          {...register("title", { required: "Title is required" })}
        />
        {errors.title && <p className="text-red-600">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          className="min-h-64"
          {...register("content", { required: "Content is required" })}
        />
        {errors.content && (
          <p className="text-red-600">{errors.content.message}</p>
        )}
      </div>
      <div className="space-y-2 prose dark:prose-invert max-w-none">
        <Label>Preview</Label>
        <Markdown
          className="rounded-md w-full border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-64"
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </Markdown>
      </div>
    </form>
  );
}
