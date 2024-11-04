import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/chat"
)({
  component: Chat,
});

function Chat() {
  return (
    <div className="p-8">Hello /$institutionId/courses/$courseId/chat!</div>
  );
}