import { Comparison } from "@/components/index/Comparison";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-8">
      <Comparison />
    </div>
  );
}
