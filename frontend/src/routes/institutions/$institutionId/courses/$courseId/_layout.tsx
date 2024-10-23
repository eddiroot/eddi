import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  BotIcon,
  ChevronRight,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { institutionId, courseId } = Route.useParams();

  return (
    <div className="flex flex-grow">
      <div
        className={`flex p-2 ease-linear duration-150 ${isSidebarOpen ? "w-40" : "w-14"}`}
      >
        <div className="flex flex-col gap-2 w-full items-end">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 [&_svg]:size-6"
            onClick={() => setIsSidebarOpen((state) => !state)}
          >
            <ChevronRight
              className={`${isSidebarOpen ? "rotate-180 ease-in-out duration-150" : "rotate-0 ease-in-out duration-150"}`}
            />
          </Button>
          <Link
            params={{ institutionId, courseId }}
            to="/institutions/$institutionId/courses/$courseId/discussion"
            className={`${!isSidebarOpen ? `${buttonVariants({ variant: "ghost", size: "icon" })} w-10` : `flex w-full items-center justify-between gap-2 px-2`} h-10 [&_svg]:size-6`}
          >
            {isSidebarOpen && <p className="text-lg font-medium">Discussion</p>}
            <MessagesSquareIcon />
          </Link>
          <Link
            params={{ institutionId, courseId }}
            to="/institutions/$institutionId/courses/$courseId/chat"
            className={`${!isSidebarOpen ? `${buttonVariants({ variant: "ghost", size: "icon" })} w-10` : `flex w-full items-center justify-between gap-2 px-2`} h-10 [&_svg]:size-6`}
          >
            {isSidebarOpen && <p className="text-lg font-medium">Chat</p>}
            <MessageCircleIcon />
          </Link>
          <Link
            params={{ institutionId, courseId }}
            to="/institutions/$institutionId/courses/$courseId/notes"
            className={`${!isSidebarOpen ? `${buttonVariants({ variant: "ghost", size: "icon" })} w-10` : `flex w-full items-center justify-between gap-2 px-2`} h-10 [&_svg]:size-6`}
          >
            {isSidebarOpen && <p className="text-lg font-medium">Notes</p>}
            <NotebookTabs />
          </Link>
          <Link
            params={{ institutionId, courseId }}
            to="/institutions/$institutionId/courses/$courseId/bot"
            className={`${!isSidebarOpen ? `${buttonVariants({ variant: "ghost", size: "icon" })} w-10` : `flex w-full items-center justify-between gap-2 px-2`} h-10 [&_svg]:size-6`}
          >
            {isSidebarOpen && <p className="text-lg font-medium">Course Bot</p>}
            <BotIcon />
          </Link>
        </div>
      </div>
      <Separator orientation="vertical" />
      <Outlet />
    </div>
  );
}
