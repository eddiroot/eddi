import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function Notifications() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 [&_svg]:size-6"
        >
          <Bell />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col justify-between">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>See what's been happening below</SheetDescription>
        </SheetHeader>
        <div className="p-4 flex-grow">Notifications go here</div>
        <SheetFooter>
          <Button className="w-full">Clear Notifications</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
