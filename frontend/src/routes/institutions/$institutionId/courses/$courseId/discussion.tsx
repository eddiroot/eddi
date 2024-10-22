// import { MessageSquareIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BASE_URL } from "@/lib/constants";
import { CourseThread } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

async function fetchCourseDiscussions(courseId: string) {
  const response = await fetch(`${BASE_URL}/app/courses/${courseId}/threads`, {
    method: "GET",
    credentials: "include",
  });
  const threads = (await response.json()) as CourseThread[];
  return threads;
}

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/discussion"
)({
  loader: ({ params }) => fetchCourseDiscussions(params.courseId),
  component: Discussion,
});

function Discussion() {
  const { institutionId, courseId } = Route.useParams();
  const courseThreads = Route.useLoaderData() as CourseThread[];

  return (
    <div className="flex flex-grow">
      <div className="p-2">Sidebar</div>
      <Separator orientation="vertical" />
      {/* Thread List */}
      <div className="p-2 gap-2 flex flex-col w-72">
        <Link
          to="/institutions/$institutionId/courses/$courseId/discussion/new"
          className={`${buttonVariants({ variant: "default" })} w-full`}
          params={{ institutionId, courseId }}
        >
          Create Thread <PlusIcon />
        </Link>
        {courseThreads.map((thread) => (
          <Link
            key={thread.id}
            to="/institutions/$institutionId/courses/$courseId/discussion/$threadId"
            params={{ institutionId, courseId, threadId: thread.id.toString() }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{thread.title}</CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-between">
                {new Date(thread.createdAt).toLocaleDateString()}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
      <Separator orientation="vertical" />
      {/* Thread */}
      <div className="flex flex-grow p-8">
        <Outlet />
      </div>
      {/* <div className="flex flex-grow justify-center items-center">
          <div className="flex flex-col items-center gap-4">
            <MessageSquareIcon size={64} />
            <span className="text-xl font-bold">Select a thread</span>
          </div>
        </div> */}
    </div>
  );
}
