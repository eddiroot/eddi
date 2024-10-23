import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/institutions/$institutionId/courses/$courseId/_layout/lessons',
)({
  component: () => <div>Hello /$institutionId/courses/$courseId/lessons!</div>,
})
