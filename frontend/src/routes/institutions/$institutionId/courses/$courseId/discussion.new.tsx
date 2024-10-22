import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/discussion/new"
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
  } = useForm<ThreadType>({
    defaultValues: {
      type: "Question",
    },
  });

  if (!user) return <p>Need to be signed in to view this page...</p>;

  const onSubmit = async ({ title, type, content }: ThreadType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/app/courses/${courseId}/threads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <select {...register("type", { required: true })}>
        {/* <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger> */}
        {/* <SelectContent> */}
        <option value="Question">Question</option>
        <option value="Post">Post</option>
        {/* </SelectContent> */}
      </select>
      <div className="space-y-2">
        <Label htmlFor="type">Title</Label>
        <Input
          id="title"
          type="text"
          {...register("title", { required: "Title is required" })}
        />
        {errors.title && <p className="text-red-600">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Content</Label>
        <Textarea
          id="content"
          {...register("content", { required: "Content is required" })}
        />
        {errors.content && (
          <p className="text-red-600">{errors.content.message}</p>
        )}
      </div>
      <Button type="submit">Create</Button>
    </form>
  );
}
