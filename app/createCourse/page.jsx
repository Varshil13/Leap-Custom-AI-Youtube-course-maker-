"use client";

import React, { useContext, useState } from "react";

import { GoProjectRoadmap } from "react-icons/go";
import { HiMiniAdjustmentsHorizontal, HiBeaker } from "react-icons/hi2";
import TopicForm from "./_components/TopicForm";
import AlterRoadmap from "./_components/AlterRoadmap";
import { UserInputContext } from "../_context/UserInputContext";
import { Button } from "@/components/ui/button";
import LoadingDialouge from "./_components/LoadingDialouge";
import toast from "react-hot-toast";
import { CourseDetails } from "@/services/schema";
import { v4 } from 'uuid';
import { useUser } from "@clerk/nextjs";
import { db } from "@/services/db";
import { useRouter } from 'next/navigation';
import { extractJsonArray } from "@/app/_utils/extractJsonArray";


export default function CreateCoursePage() {
  const StepperOptions = [
    { id: 1, label: "Roadmap", icon: <GoProjectRoadmap /> },
    { id: 2, label: "Alter Roadmap", icon: <HiMiniAdjustmentsHorizontal /> },
    
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false); // Add loading state
  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);
  const {user} = useUser();
   const router = useRouter();

  const SaveRoadmaptoDB = async () => {
    var id = v4();

    const result = await db.insert(CourseDetails).values({
      courseId: id,
      name: userCourseInput?.topic,
      level: userCourseInput?.level,
      roadmap: JSON.stringify(userCourseInput?.roadmap),
      createdBy: user?.primaryEmailAddress?.emailAddress,
      userName: user?.fullName,
      userProfileImage: user?.imageUrl,
      description: "", 
      duration: "",
      includeVideos: userCourseInput?.includeVideos ?? false,
    });
    
    router.replace('/createCourse/'+id+'/chooseVideos');
  }
  const checkStatus = () => {
    //used to check if the user has filled the form or not

    if (
      userCourseInput == undefined ||
      Object.keys(userCourseInput).length === 0
    ) {
      return true;
    }
    return false;
  };

  
  const generateRoadmap = async () => {
    // Build the prompt
    const userInputPrompt = `You are an expert curriculum designer . Your task is to generate a comprehensive, structured course roadmap in only 1 topic in JSON format based on the provided course topic description and target audience level.

**CRITICAL INSTRUCTIONS FOR OUTPUT FORMAT:**
1.  The output MUST be a single, valid JSON array.
2.  Each item in the array MUST be an object containing three keys: "id" (a sequential string starting from "1"), "title" (the main module name), and "subtopics" (an array of strings).
3.  The subtopic strings MUST be extremely short (3-5 words max), concise, and cover the maximum possible detail by splitting complex topics into multiple, fine-grained items. Do NOT use bolding, asterisks, or any markdown formatting within the strings.
4.  The roadmap should be broken down into logical modules (titles) that progress naturally from foundational concepts to advanced/applied concepts.

**INPUTS YOU MUST USE:**
1.  **Course Description:** ${userCourseInput.topic}
2.  **Course Level:** ${userCourseInput.level}

**EXAMPLE OF DESIRED OUTPUT STRUCTURE:**
[
  { "id": "1", "title": "Module Title One", "subtopics": ["Very short subtopic 1","Very short subtopic 2","Split concept for detail"] },
  { "id": "2", "title": "Module Title Two", "subtopics": ["Concise concept A","Concise concept B","Advanced concept detail"] }
]`;

    try {
      // 1. Send the request to your Next.js API Route
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

      // 2. Get the structured result from the API
      const data = await response.json();

      // Parse the roadmap from the AI response text
      const roadmap = extractJsonArray(data.text) ?? [];

      // Store the roadmap in context
      setUserCourseInput((prev) => ({
        ...(prev ?? {}),
        roadmap: roadmap,
      }));

     
    } catch (error) {
      console.error("Fetch failed:", error);
      toast.error("Failed to generate roadmap. Please try again.");
    }
  };

  

  const handleNext = async () => {
    if (activeStep === 0) {
      // Generate roadmap for step 0 -> 1
      setLoading(true); // Start loading
      await generateRoadmap();
      setLoading(false);
      setActiveStep(1 + activeStep);

    } else if (activeStep === 1) {
      // Save roadmap to DB for step 1 -> 2
      setLoading(true); // Start loading
      await SaveRoadmaptoDB();
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header / Stepper */}
      <div className="flex flex-col items-center justify-center pt-10">
        <a href="/dashboard" className="text-xs text-primary hover:underline mb-4">
          &larr; Back to Dashboard
        </a>
        <h1 className="text-3xl font-bold tracking-tight sm:text-6xl text-foreground">
          Create Course
        </h1>
        <div className="flex mt-10">
          {StepperOptions.map((step, index) => (
            <div className="flex items-center" key={index}>
              <div className="flex flex-col items-center w-[50px] md:w-[100px]">
                <div
                  className={`p-3 rounded-full text-white ${
                    activeStep >= index ? 'bg-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.icon}
                </div>
                <h2 className="hidden md:block md:text-sm font-bold text-foreground mt-2">
                  {step.label}
                </h2>
              </div>
              {index !== StepperOptions?.length - 1 && (
                <div
                  className={`h-1 w-[50px] md:w-[100px] rounded-full lg:w-[170px] ${
                    activeStep > index ? 'bg-primary' : 'bg-muted'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      {activeStep === 0 && <TopicForm />}
      {activeStep === 1 && <AlterRoadmap />}
      

      {/* CTA */}
      <div className=" mx-auto max-w-3xl">
        <div className="pt-2 flex justify-between mt-10 text-center">
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
