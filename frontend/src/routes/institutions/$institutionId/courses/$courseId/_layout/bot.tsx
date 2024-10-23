import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute(
  "/institutions/$institutionId/courses/$courseId/_layout/bot"
)({
  component: Bot,
});

const getAIResponse = (question: string) => {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(
        `Here's some information about FIT2014 related to your question: "${question}"...`
      );
    }, 1000);
  });
};

type Message = {
  role: "user" | "ai";
  content: string;
};

function Bot() {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const aiResponse = await getAIResponse(input);
    const aiMessage: Message = { role: "ai", content: aiResponse };
    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex w-full">
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {messages.map((message, index) => (
            <Card
              key={index}
              className={`mb-4 ${
                message.role === "user" ? "ml-auto" : ""
              } max-w-[80%]`}
            >
              <CardHeader>
                <CardTitle>
                  {message.role === "user" ? "You" : "FIT2014 Bot"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{message.content}</p>
              </CardContent>
            </Card>
          ))}
          {isLoading && <div className="text-center">AI is thinking...</div>}
        </ScrollArea>

        <div className="p-4 border-t h-20">
          <div className="flex space-x-2 h-full">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your course..."
              className="h-full"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button
              className="h-full"
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
