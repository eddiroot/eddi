import { Separator } from "@/components/ui/separator";
import {
  createFileRoute,
  Link,
  Outlet,
  useChildMatches,
} from "@tanstack/react-router";
import { CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BASE_URL } from "@/lib/constants";
import { CourseThread } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { MessageSquareIcon, PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import "katex/dist/katex.min.css";

async function fetchCourseDiscussions(courseId: string) {
  const response = await fetch(`${BASE_URL}/app/courses/${courseId}/threads`, {
    method: "GET",
    credentials: "include",
  });
  const threads = (await response.json()) as CourseThread[];
  return threads;
}

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/discussion"
)({
  loader: ({ params }) => fetchCourseDiscussions(params.courseId),
  component: Discussion,
});

function Discussion() {
  const { institutionId, courseId } = Route.useParams();
  const childMatches = useChildMatches();
  console.log(childMatches);

  const courseThreads = Route.useLoaderData() as CourseThread[];

  return (
    <div className="flex flex-grow">
      <div className="flex flex-col">
        <div className="p-2 border-b">
          <Input
            type="text"
            placeholder="Search threads..."
            className="w-full"
          />
        </div>
        <div className="p-2 w-64 lg:w-72 border-b">
          <Link
            to="/institutions/$institutionId/courses/$courseId/discussion/new"
            className={`${buttonVariants({ variant: "default" })} w-full h-12`}
            params={{ institutionId, courseId }}
          >
            New Thread <PlusIcon />
          </Link>
        </div>
        <div className="flex flex-col w-64 lg:w-72">
          {courseThreads?.map((thread) => (
            <Link
              key={thread.id}
              to="/institutions/$institutionId/courses/$courseId/discussion/$threadId"
              params={{
                institutionId,
                courseId,
                threadId: thread.id.toString(),
              }}
            >
              <div className="border-b">
                <CardHeader>
                  <CardTitle>{thread.title}</CardTitle>
                </CardHeader>
                <CardFooter className="flex justify-between">
                  {new Date(thread.createdAt).toLocaleDateString()}
                </CardFooter>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Separator orientation="vertical" />
      {childMatches.length == 0 && (
        <div className="flex justify-center w-full items-center">
          <div className="flex flex-col items-center gap-4">
            <MessageSquareIcon size={64} />
            <span className="text-xl font-bold">Select a thread</span>
          </div>
        </div>
      )}
      {childMatches.length > 0 && (
        <div className="flex w-full p-8">
          <Outlet />
        </div>
      )}
    </div>
  );
}
