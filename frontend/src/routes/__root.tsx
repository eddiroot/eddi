import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { HomeIcon, BellIcon } from "lucide-react";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { Logout } from "@/components/auth/logout";
import { useAuthStore } from "@/lib/auth";

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
    <>
      <div className="p-2 flex justify-between">
        <div className="flex gap-4 items-end">
          <h1 className="text-3xl">OpenEd</h1>
          <h2 className="text-2xl">Dashboard</h2>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="icon">
            <HomeIcon />
          </Button>
          <Button variant="outline" size="icon">
            <BellIcon />
          </Button>
          {user ? (
            <>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Logout />
            </>
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
    </>
  );
}
