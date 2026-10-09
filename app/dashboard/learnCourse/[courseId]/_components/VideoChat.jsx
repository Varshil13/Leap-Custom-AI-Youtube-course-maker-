"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function VideoChat({ videoId, chapterTitle, subtopicName, courseId }) {
  const hasVideo = !!videoId;
  const initialMessage = hasVideo 
    ? "Hi! I'm your AI tutor. Ask me anything about this video!"
    : "Hi! I'm your AI tutor. Ask me anything about this lesson's content!";

  const [messages, setMessages] = useState([
    { role: "assistant", content: initialMessage }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: initialMessage }]);
  }, [videoId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content,
          courseId,
          chapterTitle,
          subtopicName,
          hasVideo
        })
      });
      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't understand that." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "An error occurred while generating the response." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold flex items-center gap-2">
          <Bot size={18} className="text-primary" />
          {hasVideo ? "AI Video Tutor" : "AI Lesson Tutor"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Ask questions about {subtopicName}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-primary" />
              </div>
            )}
            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm overflow-x-auto ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none prose prose-sm dark:prose-invert"}`}>
              {msg.role === "assistant" ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User size={16} className="text-primary-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-muted rounded-bl-none flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-muted/30">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="bg-background"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
