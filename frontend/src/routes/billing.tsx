import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/billing')({
  component: () => <div>Hello /billing!</div>,
})
