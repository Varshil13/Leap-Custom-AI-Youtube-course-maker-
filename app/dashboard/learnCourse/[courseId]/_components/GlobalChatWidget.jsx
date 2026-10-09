"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import toast from "react-hot-toast";

export default function GlobalChatWidget({ courseId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [hasIngested, setHasIngested] = useState(false);
  
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I am your Global Course Tutor. I know everything about this entire course. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Optionally, you can automatically trigger ingestion the first time they open it
  const handleOpen = async () => {
    setIsOpen(true);
    if (!hasIngested) {
      setIsIngesting(true);
      try {
        await fetch("/api/ingest-course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId })
        });
        setHasIngested(true);
      } catch (err) {
        toast.error("Failed to prepare course memory.");
      } finally {
        setIsIngesting(false);
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/global-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, question: userMsg })
      });
      const data = await res.json();
      
      if (data.text) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.text,
          sources: data.sources
        }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to AI Tutor." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button 
          onClick={handleOpen}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 flex items-center justify-center bg-primary text-primary-foreground hover:scale-105 transition-transform"
        >
          <MessageCircle size={28} />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-[380px] h-[550px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden flex-shrink-0 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold text-sm">Global Course Tutor</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-primary-foreground/20 p-1 rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
            {isIngesting && (
               <div className="text-xs text-center text-muted-foreground p-3 bg-muted rounded-lg border border-border flex flex-col items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  Please wait, I am memorizing the entire course...
               </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm overflow-x-auto ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm prose prose-sm dark:prose-invert border border-border"}`}>
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 text-[10px] text-muted-foreground max-w-[80%]">
                    Sources: {Array.from(new Set(msg.sources)).join(", ")}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="px-4 py-3 rounded-2xl bg-muted rounded-bl-sm flex items-center gap-2 text-sm text-muted-foreground border border-border">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-card border-t border-border">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about the course..."
                className="bg-background rounded-full focus-visible:ring-primary/20"
                disabled={isIngesting}
              />
              <Button type="submit" disabled={!input.trim() || isLoading || isIngesting} size="icon" className="rounded-full shrink-0">
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
