import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/institutions/$institutionId/')({
  component: () => <div>Hello /$institutionId/!</div>,
})
