import { BASE_URL } from "@/lib/constants";
import { CourseLessonSectionWithBlocks } from "@/lib/types";
import { createFileRoute } from "@tanstack/react-router";

async function fetchLessonSectionsAndBlocks(
  courseId: string,
  lessonId: string
) {
  const response = await fetch(
    `${BASE_URL}/app/courses/${courseId}/lessons/${lessonId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  const sections = (await response.json()) as CourseLessonSectionWithBlocks[];
  return sections;
}

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/lessons/$lessonId"
)({
  component: () => (
    <div>
      Hello
      /institutions/$institutionId/courses/$courseId/_layout/lessons/$lessonId!
    </div>
  ),
  loader: ({ params }) =>
    fetchLessonSectionsAndBlocks(params.courseId, params.lessonId),
});
