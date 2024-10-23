import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/notes"
)({
  component: Notebook,
});

interface Note {
  id: number;
  title: string;
  content: string;
}

function Notebook() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Introduction to React",
      content: "React is a JavaScript library for building user interfaces...",
    },
    {
      id: 2,
      title: "State Management",
      content: "State management is a crucial concept in React...",
    },
  ]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addNewNote = () => {
    const newNote = {
      id: notes.length + 1,
      title: "New Note",
      content: "",
    };
    setNotes([...notes, newNote]);
    setSelectedNote(newNote);
  };

  const updateNote = (id: number, title: string, content: string) => {
    const updatedNotes = notes.map((note) =>
      note.id === id ? { ...note, title, content } : note
    );
    setNotes(updatedNotes);
    setSelectedNote({ id, title, content });
  };

  return (
    <div className="flex w-full">
      <div className="flex flex-col w-64 lg:w-72 border-r">
        <div className="p-2 border-b">
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-col p-2 gap-2">
          <Button onClick={addNewNote} className="w-full">
            New Note <PlusIcon />
          </Button>
          <ScrollArea className="flex-grow">
            <div className="flex flex-col gap-2">
              {filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  className={`cursor-pointer ${
                    selectedNote?.id === note.id ? "" : ""
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <CardHeader>
                    <CardTitle>{note.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm truncate">{note.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      <div className="flex-grow p-6 h-full">
        {selectedNote ? (
          <div className="flex flex-col gap-4 h-full">
            <div className="flex gap-2">
              <Input
                type="text"
                value={selectedNote.title}
                onChange={(e) =>
                  updateNote(
                    selectedNote.id,
                    e.target.value,
                    selectedNote.content
                  )
                }
                className="text-xl font-bold"
              />
              <Button>Save</Button>
            </div>
            <Textarea
              value={selectedNote.content}
              onChange={(e) =>
                updateNote(selectedNote.id, selectedNote.title, e.target.value)
              }
              className="w-full h-full resize-none max-h-full box-border"
              placeholder="Start typing your notes here..."
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Select a note or create a new one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
