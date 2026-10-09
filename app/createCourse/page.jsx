"use client";

import React, { useContext, useState } from "react";

import { Map, SlidersHorizontal, ArrowLeft } from "lucide-react";
import TopicForm from "./_components/TopicForm";
import AlterRoadmap from "./_components/AlterRoadmap";
import { UserInputContext } from "../_context/UserInputContext";
import { Button } from "@/components/ui/button";
import LoadingDialouge from "./_components/LoadingDialouge";
import toast from "react-hot-toast";
import { CourseDetails } from "@/services/schema";
import { v4 } from 'uuid';
import { useSession } from "next-auth/react";
import { db } from "@/services/db";
import { useRouter } from 'next/navigation';
import { extractJsonArray } from "@/app/_utils/extractJsonArray";


export default function CreateCoursePage() {
  const StepperOptions = [
    { id: 1, label: "Course Details", icon: <Map size={20} /> },
    { id: 2, label: "Course Roadmap", icon: <SlidersHorizontal size={20} /> },
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);
  const { data: session } = useSession();
   const router = useRouter();

  const SaveRoadmaptoDB = async () => {
    var id = v4();

    let initialNextVideo = null;
    if (userCourseInput?.roadmap && userCourseInput.roadmap.length > 0) {
      const firstChapter = userCourseInput.roadmap[0];
      if (firstChapter.subtopics && firstChapter.subtopics.length > 0) {
        initialNextVideo = typeof firstChapter.subtopics[0] === 'string' ? firstChapter.subtopics[0] : firstChapter.subtopics[0].name;
      }
    }

    const result = await db.insert(CourseDetails).values({
      courseId: id,
      name: userCourseInput?.topic,
      level: userCourseInput?.level,
      roadmap: JSON.stringify(userCourseInput?.roadmap),
      createdBy: session?.user?.email,
      userName: session?.user?.name,
      userProfileImage: session?.user?.image,
      description: "", 
      duration: "",
      includeVideos: userCourseInput?.includeVideos ?? false,
      nextVideoToWatch: initialNextVideo,
    });
    
    if (userCourseInput?.includeVideos) {
      router.replace('/createCourse/'+id+'/chooseVideos');
    } else {
      router.replace('/dashboard/learnCourse/'+id);
    }
  }
  const checkStatus = () => {
    if (
      userCourseInput == undefined ||
      Object.keys(userCourseInput).length === 0
    ) {
      return true;
    }
    return false;
  };

  
  const generateRoadmap = async () => {
    const userInputPrompt = `You are an expert curriculum designer . Your task is to generate a comprehensive, structured course roadmap in only 1 topic in JSON format based on the provided course topic description and target audience level.

**CRITICAL INSTRUCTIONS FOR OUTPUT FORMAT:**
1.  The output MUST be a single, valid JSON array.
2.  Each item in the array MUST be an object containing three keys: "id" (a sequential string starting from "1"), "title" (the main module name), and "subtopics" (an array of objects).
3.  Each object inside the "subtopics" array MUST contain two keys: "name" (a very short 3-5 word string for the concept) and "youtubeSearchQuery" (a highly specific, SEO-optimized YouTube search query for finding a tutorial on this specific concept, making sure to include the main course topic for context).
4.  The roadmap should be broken down into logical modules (titles) that progress naturally from foundational concepts to advanced/applied concepts.

**INPUTS YOU MUST USE:**
1.  **Course Description:** ${userCourseInput.topic}
2.  **Course Level:** ${userCourseInput.level}

**EXAMPLE OF DESIRED OUTPUT STRUCTURE:**
[
  { "id": "1", "title": "Module Title One", "subtopics": [{ "name": "Very short subtopic 1", "youtubeSearchQuery": "${userCourseInput.topic} very short subtopic 1 tutorial" }, { "name": "Another subtopic", "youtubeSearchQuery": "${userCourseInput.topic} another subtopic complete guide" }] },
  { "id": "2", "title": "Module Title Two", "subtopics": [{ "name": "Concise concept A", "youtubeSearchQuery": "${userCourseInput.topic} concise concept A explained" }] }
]`;

    try {
      const response = await fetch("/api/genRoadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userInputPrompt }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const roadmap = extractJsonArray(data.text) ?? [];

      setUserCourseInput((prev) => ({
        ...(prev ?? {}),
        roadmap: roadmap,
      }));

      return true;
    } catch (error) {
      console.error("Fetch failed:", error);
      toast.error("Failed to generate roadmap. Please try again.");
      return false;
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      setLoading(true);
      const success = await generateRoadmap();
      setLoading(false);
      
      if (success) {
        setActiveStep(1 + activeStep);
      }
    } else if (activeStep === 1) {
      setLoading(true);
      await SaveRoadmaptoDB();
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header / Stepper */}
      <div className="flex flex-col items-center justify-center pt-6">
        <a href="/dashboard" className="text-xs text-primary hover:underline mb-2">
          <ArrowLeft size={14} className="inline mr-1" /> Back to Dashboard
        </a>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl text-foreground">
          Create Course
        </h1>
        <div className="flex mt-8">
          {StepperOptions.map((step, index) => (
            <div className="flex" key={index}>
              <div className="flex flex-col items-center w-[60px] md:w-[120px]">
                <div
                  className={`p-3 rounded-full text-white z-10 ${
                    activeStep >= index ? 'bg-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.icon}
                </div>
                <h2 className="hidden md:block md:text-sm font-bold text-foreground mt-2 text-center">
                  {step.label}
                </h2>
              </div>
              {index !== StepperOptions?.length - 1 && (
                <div className="pt-5 -ml-4 -mr-4 z-0">
                  <div
                    className={`h-1 w-[50px] md:w-[100px] rounded-full lg:w-[170px] ${
                      activeStep > index ? 'bg-primary' : 'bg-muted'
                    }`}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      {activeStep === 0 && <TopicForm />}
      {activeStep === 1 && <AlterRoadmap />}
      

      {/* CTA */}
      <div className="mx-auto max-w-3xl pb-10">
        <div className="pt-2 flex justify-between mt-6 text-center">
          <Button
            variant="outline"
            disabled={activeStep === 0 || loading}
            onClick={() => setActiveStep(activeStep - 1)}
            type="button"
            size="lg"
            className="h-12 px-10 text-base sm:text-lg"
          >
            Previous
          </Button>
          {activeStep < 2 && (
            <Button
              disabled={checkStatus() || loading}
              onClick={handleNext}
              type="button"
              size="lg"
              className="h-12 px-10 text-base sm:text-lg"
            >
              {loading ? "Generating..." : "Next"}
            </Button>
          )}

        </div>
      </div>
      <LoadingDialouge loading={loading} activeStep={activeStep} />
    </div>
  );
}
