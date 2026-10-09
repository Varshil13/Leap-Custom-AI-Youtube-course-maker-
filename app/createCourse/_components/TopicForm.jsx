"use client";

import { UserInputContext } from "@/app/_context/UserInputContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import React, { useContext, useState } from "react";

function TopicForm() {
  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);
  const [topic, setTopic] = useState(userCourseInput?.topic ?? "");
  const [level, setLevel] = useState(userCourseInput?.level);
  const levels = [
    { label: "Introductory" },
    { label: "Beginner" },
    { label: "Intermediate" },
    { label: "Advanced" },
  ];

  function handleTopic(value) {
    setTopic(value);
    setUserCourseInput(prev => ({ ...(prev ?? {}), topic: value }));
  }

  function handleLevel(value) {
    setLevel(value);
    setUserCourseInput(prev => ({ ...(prev ?? {}), level: value }));
  }

  const [includeVideos, setIncludeVideos] = useState(userCourseInput?.includeVideos ?? false);
  function handleIncludeVideos(value) {
    setIncludeVideos(value);
    setUserCourseInput(prev => ({ ...(prev ?? {}), includeVideos: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
  }

  return (
    <div className="mx-auto mt-10 max-w-3xl px-4">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium text-foreground">
                Topic
              </label>
              <Input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => handleTopic(e.target.value)}
                autoComplete="off"
                required
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">
                What should the course be about?
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Difficulty Level
              </label>
              <div className="flex flex-wrap gap-2">
                {levels.map((l) => (
                  <Button
                    key={l.label}
                    type="button"
                    variant={level === l.label ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLevel(l.label)}
                    aria-pressed={level === l.label}
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Choose the difficulty that best fits your audience.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Include Videos
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={includeVideos ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleIncludeVideos(true)}
                  aria-pressed={includeVideos}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={!includeVideos ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleIncludeVideos(false)}
                  aria-pressed={!includeVideos}
                >
                  No
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Would you like to include videos in your course?
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default TopicForm;
