import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/chat"
)({
  component: () => <div>Hello /$institutionId/courses/$courseId/chat!</div>,
});
