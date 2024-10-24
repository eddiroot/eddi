import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckIcon, XIcon } from "lucide-react";

type Feature = {
  feature: string;
  OpenEd: boolean;
  EdStem: boolean;
  implemented: boolean;
};

const features: Feature[] = [
  {
    feature: "Discussion",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "Lessons",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "Chat",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "Workspaces",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "Course Bot",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "Pull Requests",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
  {
    feature: "Assessments",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
  {
    feature: "Tutor",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
  {
    feature: "Public Courses",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },

  {
    feature: "Student Stats",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "Analytics",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "Export",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
];

export function Comparison() {
  return (
    <div>
      {/* Title */}
      <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          Feature Comparison
        </h2>
        <p className="mt-1 text-muted-foreground">
          Compare the functionality of ed to other systems.
        </p>
      </div>
      {/* End Title */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature</TableHead>
            <TableHead>ed</TableHead>
            <TableHead>EdStem</TableHead>
            <TableHead>Implemented</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => (
            <TableRow key={feature.feature}>
              <TableCell>{feature.feature}</TableCell>
              <TableCell>
                {feature.OpenEd ? (
                  <CheckIcon
                    color="white"
                    className="bg-green-500 rounded-sm"
                  />
                ) : (
                  <XIcon color="white" className="bg-red-500 rounded-sm" />
                )}
              </TableCell>
              <TableCell>
                {feature.EdStem ? (
                  <CheckIcon
                    color="white"
                    className="bg-green-500 rounded-sm"
                  />
                ) : (
                  <XIcon color="white" className="bg-red-500 rounded-sm" />
                )}
              </TableCell>
              <TableCell>
                {feature.implemented ? (
                  <CheckIcon
                    color="white"
                    className="bg-green-500 rounded-sm"
                  />
                ) : (
                  <XIcon color="white" className="bg-red-500 rounded-sm" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
