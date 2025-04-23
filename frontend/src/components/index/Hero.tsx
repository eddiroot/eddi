import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <>
      {/* Hero */}
      <div className="container py-24 lg:py-32">
        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-8 xl:gap-20 md:items-center">
          <div>
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
              Openly evolving education.
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              The learning management system that <strong>anyone</strong> can
              use.
            </p>
            {/* Buttons */}
            <div className="mt-8 grid gap-3 w-full sm:inline-flex">
              <Button variant="outline" size="lg">
                Watch the demo
              </Button>
              <Button size="lg">Get started</Button>
            </div>
          </div>
          {/* Col */}
          <div className="relative ms-4">
            <img
              className="h-auto max-w-xl rounded-lg shadow-xl dark:shadow-gray-800"
              src="clay-students.jpeg"
              alt="Students using laptops"
            />
          </div>
          {/* End Col */}
        </div>
        {/* End Grid */}
      </div>
      {/* End Hero */}
    </>
  );
}
