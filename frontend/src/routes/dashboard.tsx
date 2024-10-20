import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { UserCourseJoinCourse } from "@/lib/types";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Card,
  // CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Archive, Trash } from "lucide-react";

async function fetchUserCourses() {
  const userId = useAuthStore.getState().user?.id;
  if (userId == null) return;
  const response = await fetch(`${BASE_URL}/app/userCourses/${userId}`, {
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {userCourses?.map((course) => (
        <Link
          to="/institutions/$institutionId/courses/$courseId/discussion"
          params={{
            institutionId: course.institutionId.toString(),
            courseId: course.courseId.toString(),
          }}
        >
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                {course.name} - {course.year}
              </CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
            {/* <CardContent>Content here</CardContent> */}
            <CardFooter className="flex gap-2">
              <Button variant="secondary" size="icon">
                <Archive />
              </Button>
              <Button variant="secondary" size="icon">
                <Trash />
              </Button>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
