import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import {
  BookOpenTextIcon,
  BotIcon,
  MessageCircleIcon,
  MessagesSquareIcon,
  NotebookTabs,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout"
)({
  component: Layout,
});

function Layout() {
  const { institutionId, courseId } = Route.useParams();

  return (
    <div className="flex flex-grow">
      <div className="flex p-2 ease-linear duration-150 w-14">
        <div className="flex flex-col gap-2 w-full items-end">
          <Link
            params={{ institutionId, courseId }}
            to="/institutions/$institutionId/courses/$courseId/discussion"
            className={`${buttonVariants({ variant: "ghost", size: "icon" })} w-10 h-10 [&_svg]:size-6`}
          >
            <MessagesSquareIcon />
          </Link>
          <Link
            params={{ institutionId, courseId }}
            to="/institutions/$institutionId/courses/$courseId/lessons"
            className={`${buttonVariants({ variant: "ghost", size: "icon" })} w-10 h-10 [&_svg]:size-6`}
          >
            <BookOpenTextIcon />
          </Link>
          <Link
            params={{ institutionId, courseId }}
            to="/institutions/$institutionId/courses/$courseId/chat"
            className={`${buttonVariants({ variant: "ghost", size: "icon" })} w-10 h-10 [&_svg]:size-6`}
          >
            <MessageCircleIcon />
          </Link>
          <Link
            params={{ institutionId, courseId }}
            to="/institutions/$institutionId/courses/$courseId/notes"
            className={`${buttonVariants({ variant: "ghost", size: "icon" })} w-10 h-10 [&_svg]:size-6`}
          >
            <NotebookTabs />
          </Link>
          <Link
            params={{ institutionId, courseId }}
            to="/institutions/$institutionId/courses/$courseId/bot"
            className={`${buttonVariants({ variant: "ghost", size: "icon" })} w-10 h-10 [&_svg]:size-6`}
          >
            <BotIcon />
          </Link>
        </div>
      </div>
      <Separator orientation="vertical" />
      <Outlet />
    </div>
  );
}
