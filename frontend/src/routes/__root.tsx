// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { User2, LayoutDashboard } from "lucide-react";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { Logout } from "@/components/auth/logout";
import { useAuthStore } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notifications } from "@/components/root/notifications";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        }))
      );

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col h-screen">
      <div className="py-2 px-8 h-20 flex justify-between">
        <Link to="/" className="flex gap-2 items-center">
          <h1 className="text-3xl font-medium">ed</h1>
        </Link>
        <div className="flex gap-3 items-center">
          <Link
            to="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "w-10 h-10 [&_svg]:size-6"
            )}
          >
            <LayoutDashboard />
          </Link>
          <ModeToggle />
          <Notifications />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 [&_svg]:size-6"
                >
                  <User2 />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <Link to="/profile">
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                  </Link>
                  <Link to="/billing">
                    <DropdownMenuItem>Billing</DropdownMenuItem>
                  </Link>
                  <Link to="/settings">
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <Logout />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className={buttonVariants({ variant: "default" })}
            >
              Login
            </Link>
          )}
        </div>
      </div>
      <hr />
      <Outlet />
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </div>
  );
}
