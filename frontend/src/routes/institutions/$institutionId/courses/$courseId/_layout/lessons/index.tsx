import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { BASE_URL } from "@/lib/constants";
import { CourseLesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, RefreshCcw, SearchIcon } from "lucide-react";

async function fetchCourseLessons(courseId: string) {
  const response = await fetch(`${BASE_URL}/app/course/${courseId}/lesson`, {
    method: "GET",
    credentials: "include",
  });
  const threads = (await response.json()) as CourseLesson[];
  return threads;
}

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/lessons/"
)({
  component: Lessons,
  loader: ({ params }) => fetchCourseLessons(params.courseId),
});

function Lessons() {
  const lessons = Route.useLoaderData() as CourseLesson[];
  const { institutionId, courseId } = Route.useParams();

  // Group lessons by courseWeek
  const lessonsByWeek = lessons?.reduce(
    (acc: { [key: number]: CourseLesson[] }, lesson) => {
      const { CourseWeek } = lesson;
      if (!acc[CourseWeek]) {
        acc[CourseWeek] = [];
      }
      acc[CourseWeek].push(lesson);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-grow flex-col gap-8 p-8">
      <div className="flex justify-between gap-8">
        <div className="flex items-center space-x-4">
          <div className="relative rounded-lg w-72">
            <Input type="text" placeholder="Search lessons" className="pl-8" />
            <SearchIcon className="absolute left-2.5 top-2.5 w-4 h-4" />
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost">
            Refresh <RefreshCcw />
          </Button>
          <Link
            className={buttonVariants({ variant: "ghost" })}
            to="/institutions/$institutionId/courses/$courseId/lessons/new"
            params={{ institutionId, courseId }}
          >
            Add Lesson <Plus />
          </Link>
        </div>
      </div>
      <div className="space-y-8">
        {lessonsByWeek &&
          Object.entries(lessonsByWeek).map(([week, lessons]) => (
            <div className="space-y-4" key={week}>
              <h1 className="text-xl font-bold">Week {week}</h1>
              <Separator />
              <ol className="space-y-2">
                {lessons.map((lesson) => (
                  <Link
                    key={lesson.ID}
                    to="/institutions/$institutionId/courses/$courseId/lessons/$lessonId"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "w-full justify-start"
                    )}
                    params={{
                      institutionId,
                      courseId,
                      lessonId: lesson.ID.toString(),
                    }}
                  >
                    <li key={lesson.ID}>{lesson.Title}</li>
                  </Link>
                ))}
              </ol>
            </div>
          ))}
      </div>
    </div>
  );
}
