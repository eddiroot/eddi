import { useAuthStore } from "@/lib/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    const isLoggedIn = useAuthStore.getState().user;
    if (isLoggedIn) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  component: () => <div>Hello /signup!</div>,
});
