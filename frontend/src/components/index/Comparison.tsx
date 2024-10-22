import {
  Table,
  TableBody,
  TableCaption,
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
    feature: "Discussion AI",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
  {
    feature: "Lessons",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "Lesson Pull Requests",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
  {
    feature: "Workspaces",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "eAssessments",
    OpenEd: true,
    EdStem: true,
    implemented: false,
  },
  {
    feature: "Multi-Institution Courses",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
  {
    feature: "Course Chat",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
  {
    feature: "Student Stats",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
  {
    feature: "Analytics",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
  {
    feature: "Raw Data Export",
    OpenEd: true,
    EdStem: false,
    implemented: false,
  },
];

export function Comparison() {
  return (
    <Table>
      <TableCaption>A feature comparison of OpenEd to EdStem.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Feature</TableHead>
          <TableHead>OpenEd</TableHead>
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
                <CheckIcon color="white" className="bg-green-500 rounded-sm" />
              ) : (
                <XIcon color="white" className="bg-red-500 rounded-sm" />
              )}
            </TableCell>
            <TableCell>
              {feature.EdStem ? (
                <CheckIcon color="white" className="bg-green-500 rounded-sm" />
              ) : (
                <XIcon color="white" className="bg-red-500 rounded-sm" />
              )}
            </TableCell>
            <TableCell>
              {feature.implemented ? (
                <CheckIcon color="white" className="bg-green-500 rounded-sm" />
              ) : (
                <XIcon color="white" className="bg-red-500 rounded-sm" />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
