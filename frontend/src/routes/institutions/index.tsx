import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/institutions/')({
  component: () => <div>Hello /institutions/!</div>,
})
