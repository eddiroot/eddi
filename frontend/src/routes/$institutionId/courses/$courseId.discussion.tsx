import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/$institutionId/courses/$courseId/discussion',
)({
  loader: ({ params }) => console.log(params.courseId),
  component: PostComponent,
})

function PostComponent() {
  const { courseId } = Route.useParams()
  return <div>Course ID: {courseId}</div>
}
