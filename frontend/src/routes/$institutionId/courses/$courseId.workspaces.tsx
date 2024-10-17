import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/$institutionId/courses/$courseId/workspaces',
)({
  component: () => (
    <div>Hello /$institutionId/courses/$courseId/workspaces!</div>
  ),
})
