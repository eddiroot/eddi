import { Comparison } from "@/components/index/Comparison";
import { HeroSection } from "@/components/index/Hero";
import { Pricing } from "@/components/index/Pricing";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="w-full flex justify-center p-8">
      <div className="container space-y-20">
        <HeroSection />
        <Comparison />
        <Pricing />
      </div>
    </div>
  );
}
