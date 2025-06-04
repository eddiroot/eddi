import { FileUploader } from "@/components/file-uploader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AudioLinesIcon,
  Disc2Icon,
  DiscIcon,
  ImageIcon,
  NotepadTextIcon,
  PencilIcon,
  Plus,
  TextCursorInputIcon,
  TextIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/lessons/new"
)({
  component: CreateLesson,
});

const blockTypeSelections = [
  {
    label: "Text",
    value: "Text",
    element: <TextIcon />,
  },
  {
    label: "Audio",
    value: "Audio",
    element: <AudioLinesIcon />,
  },
  {
    label: "Image",
    value: "Image",
    element: <ImageIcon />,
  },
  {
    label: "Short Input",
    value: "Input",
    element: <TextCursorInputIcon />,
  },
  {
    label: "Long Input",
    value: "TextArea",
    element: <NotepadTextIcon />,
  },
  {
    label: "Single Select",
    value: "MCSingleAnswer",
    element: <DiscIcon />,
  },
  {
    label: "Multi Select",
    value: "MCMultiAnswer",
    element: <Disc2Icon />,
  },
];

type BlockType = {
  id: number;
  type: string;
  content: string;
};

function renderBlock(block: BlockType) {
  switch (block.type) {
    case "Text":
      return <Textarea className="min-h-20" value={block.content} />;

    case "Audio":
      if (block.content != "") {
        return <audio controls src={block.content}></audio>;
      }
      return <FileUploader />;

    case "Image":
      if (block.content != "") {
        return <img src={block.content} alt="Image" />;
      }
      return <FileUploader />;

    case "Input":
      return <p>Short Input</p>;

    case "TextArea":
      return <p>Text Area</p>;

    case "MCSingleAnswer":
      return <p>Single Select</p>;

    case "MCMultiAnswer":
      return <p>Multi Select</p>;

    default:
      return <p>Block was an invalid type</p>;
  }
}

type SectionType = {
  id: number;
  title: string;
  blocks: BlockType[];
};

type LessonType = {
  title: string;
  sections: SectionType[];
};

function CreateLesson() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editSectionId, setEditSectionId] = useState<number | null>(null);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const { institutionId, courseId } = Route.useParams();

  const {
    watch,
    register,
    handleSubmit,
    // formState: { errors },
  } = useForm<LessonType>({
    defaultValues: { title: "Your Lesson Title Here" },
  });

  const title = watch("title");

  if (!user) return <p>You need to be signed in to view this page...</p>;

  const onSubmit = async ({ title, sections }: LessonType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/app/course/${courseId}/lesson`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.ID,
            courseId: parseInt(courseId),
            title,
            sections,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const body = await response.json();
        navigate({
          to: "/institutions/$institutionId/courses/$courseId/lessons/$lessonId",
          params: { institutionId, courseId, lessonId: body.id },
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const sectionChangeHandler = (id: number, value: string) => {
    setSections((sections) => {
      return sections.map((section) =>
        id === section.id ? { ...section, title: value } : section
      );
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 p-8">
      <div className="flex justify-between h-10 items-center">
        <Label htmlFor="title" className="sr-only">
          Title
        </Label>
        {isEditingTitle ? (
          <Input
            id="title"
            type="text"
            className="w-1/3"
            autoFocus
            minLength={3}
            {...register("title")}
            onBlur={() => setIsEditingTitle(false)}
          />
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-xl">{title}</h1>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setIsEditingTitle(true)}
            >
              <PencilIcon />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Link
            className={buttonVariants({ variant: "link" })}
            to="/institutions/$institutionId/courses/$courseId/lessons"
            params={{ institutionId, courseId }}
          >
            Cancel
          </Link>
          <Button type="submit">Create</Button>
        </div>
      </div>
      <div className="grid grid-cols-[200px_1fr] gap-8">
        <div className="space-y-4">
          <Button
            variant="outline"
            type="button"
            className="h-10 flex justify-center items-center w-full"
            onClick={() =>
              setSections([
                ...sections,
                {
                  id:
                    Math.max(-1, ...sections.map((section) => section.id)) + 1,
                  title: "New Section",
                  blocks: [],
                },
              ])
            }
          >
            Add Section <Plus />
          </Button>
          <div className="space-y-1">
            {sections.map((section) =>
              editSectionId == section.id ? (
                <Input
                  key={section.id}
                  onChange={(e) =>
                    sectionChangeHandler(section.id, e.target.value)
                  }
                  autoFocus
                  onBlur={() => setEditSectionId(null)}
                  value={section.title}
                />
              ) : (
                <div
                  key={section.id}
                  className="flex items-center justify-between"
                >
                  <h2
                    onClick={() => setSelectedSection(section.id)}
                    className={`cursor-pointer max-w-[160px] truncate ${section.id == selectedSection ? "font-bold" : ""}`}
                  >
                    {section.title}
                  </h2>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditSectionId(section.id)}
                  >
                    <PencilIcon />
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
        <div>
          {selectedSection == null ? (
            <p className="h-20 border rounded-lg flex justify-center items-center w-full">
              Select a section first
            </p>
          ) : (
            <div className="space-y-4">
              {sections[selectedSection]?.blocks.map((block) => (
                <div
                  key={block.id}
                  className={`min-h-20 ${block.type == "" ? "rounded-lg border" : ""}`}
                >
                  {block.type == "" ? (
                    <div className="flex justify-center h-20 items-center gap-2">
                      {blockTypeSelections.map((t) => (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          title={t.label}
                          onClick={() => {
                            setSections(
                              sections.map((section) =>
                                selectedSection === section.id
                                  ? {
                                      ...section,
                                      blocks: section.blocks.map(
                                        (innerBlock) =>
                                          innerBlock.id == block.id
                                            ? { ...innerBlock, type: t.value }
                                            : innerBlock
                                      ),
                                    }
                                  : section
                              )
                            );
                          }}
                        >
                          {t.element}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    renderBlock(block)
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                type="button"
                className="h-20 flex justify-center items-center w-full"
                onClick={() =>
                  setSections(
                    sections.map((section) =>
                      selectedSection === section.id
                        ? {
                            ...section,
                            blocks: [
                              ...section.blocks,
                              {
                                id:
                                  (section.blocks[section.blocks.length - 1]
                                    ?.id ?? -1) + 1,
                                type: "",
                                content: "",
                              },
                            ],
                          }
                        : section
                    )
                  )
                }
              >
                Add Block <Plus />
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
