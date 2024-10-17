import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$institutionId/courses/')({
  component: () => <div>Hello /$institutionId/courses/!</div>,
})
