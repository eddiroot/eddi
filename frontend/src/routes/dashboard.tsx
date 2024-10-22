import { useAuthStore } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { UserCourseJoinCourse } from "@/lib/types";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Card,
  // CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function fetchUserCourses() {
  const response = await fetch(`${BASE_URL}/app/user/courses`, {
    method: "GET",
    credentials: "include",
  });
  const userCourses = (await response.json()) as UserCourseJoinCourse[];
  return userCourses;
}

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const isLoggedIn = useAuthStore.getState().user;
    if (!isLoggedIn) {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: fetchUserCourses,
  component: Dashboard,
  pendingComponent: PendingDashboard,
});

function PendingDashboard() {
  return <div>Pending...</div>;
}

function Dashboard() {
  const userCourses = Route.useLoaderData() as UserCourseJoinCourse[];

  return (
    <div className="p-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
      {userCourses?.map((course) => (
        <Link
          to="/institutions/$institutionId/courses/$courseId/discussion"
          key={course.courseId}
          params={{
            institutionId: course.institutionId.toString(),
            courseId: course.courseId.toString(),
          }}
        >
          <Card className="w-full">
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle>
                  {course.name} - {course.year}
                </CardTitle>
                <Badge>{Math.floor(Math.random() * 10) + 1}</Badge>
              </div>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
