import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckIcon } from "lucide-react";

export function Pricing() {
  return (
    <div>
      {/* Title */}
      <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          Pricing
        </h2>
        <p className="mt-1 text-muted-foreground">
          No matter how big or small, we can help you make education better
        </p>
      </div>
      {/* End Title */}
      {/* Grid */}
      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:items-center">
        {/* Card */}
        <Card className="h-96">
          <CardHeader className="text-center pb-2">
            <CardTitle className="mb-7">Community</CardTitle>
            <div>
              <span className="font-bold text-5xl">$0</span>
              <span className="text-sm">/user/month</span>
            </div>
          </CardHeader>
          <CardDescription className="text-center w-10/12 mx-auto">
            For schools in disadvantaged communities
          </CardDescription>
          <CardContent>
            <ul className="mt-7 space-y-2.5 text-sm">
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Discussion, Lessons
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Access to all public courses
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Standard email support
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
        {/* End Card */}
        {/* Card */}
        <Card className="h-96">
          <CardHeader className="text-center pb-2">
            <CardTitle className="!mb-7">Basic</CardTitle>
            <div>
              <span className="font-bold text-5xl">$1</span>
              <span className="text-sm">/user/month</span>
            </div>
          </CardHeader>
          <CardDescription className="text-center w-10/12 mx-auto">
            Unlock core functionality
          </CardDescription>
          <CardContent>
            <ul className="mt-7 space-y-2.5 text-sm">
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Discussion, Lessons
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Access to all public courses
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Premium email support
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
        {/* End Card */}
        {/* Card */}
        <Card className="h-96">
          <CardHeader className="text-center pb-2">
            <CardTitle className="mb-7">Standard</CardTitle>
            <div>
              <span className="font-bold text-5xl">$2</span>
              <span className="text-sm">/user/month</span>
            </div>
          </CardHeader>
          <CardDescription className="text-center  w-10/12 mx-auto">
            Unlock core + additional functionality
          </CardDescription>
          <CardContent>
            <ul className="mt-7 space-y-2.5 text-sm">
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Discussion, Lessons, Chat, Workspaces
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Access to all public courses
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Premium email support
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
        {/* End Card */}
        {/* Card */}
        <Card className="h-96">
          <CardHeader className="text-center pb-2">
            <CardTitle className="mb-7">Enterprise</CardTitle>
            <div>
              <span className="font-bold text-5xl">$3</span>
              <span className="text-sm">/user/month</span>
            </div>
          </CardHeader>
          <CardDescription className="text-center w-10/12 mx-auto">
            Unlock all functionality and enterprise-level support
          </CardDescription>
          <CardContent>
            <ul className="mt-7 space-y-2.5 text-sm">
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Discussion, Lessons, Chat, Workspaces, Course Bot,
                  Assessments, Stats, Analytics, Export
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Access to all public courses
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
                <span className="text-muted-foreground">
                  Premium email and phone support
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
        {/* End Card */}
      </div>
      {/* End Grid */}
    </div>
  );
}
