import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2 container">
      <h1 className="font-bold text-2xl">Features to add</h1>
      <p>AI scanning over content to ask questions over a unit</p>
      <p>Editable lessons with PRs</p>
      <p>Filtered live chat </p>
    </div>
  );
}
