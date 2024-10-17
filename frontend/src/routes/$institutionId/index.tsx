import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$institutionId/')({
  component: () => <div>Hello /$institutionId/!</div>,
})
