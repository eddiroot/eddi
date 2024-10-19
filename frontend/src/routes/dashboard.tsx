import { useAuthStore } from "@/lib/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const isLoggedIn = useAuthStore.getState().user;
    if (!isLoggedIn) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: () => <div>Hello /dashboard!</div>,
});
