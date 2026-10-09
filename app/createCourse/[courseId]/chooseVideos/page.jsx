"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/services/db";
import { CourseDetails } from "@/services/schema";
import getVideos from "@/services/youtube";
import { eq } from "drizzle-orm";
import { CourseVideos } from "@/services/schema";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function ChooseVideosPage() {
  const params = useParams();
  const courseId = params.courseId;
  const [course, setCourse] = useState(null);
  const [roadmap, setRoadmap] = useState([]);
  const [lessonVideos, setLessonVideos] = useState({});
  const [selectedVideos, setSelectedVideos] = useState({});
  const [customUrls, setCustomUrls] = useState({});
  const [tab, setTab] = React.useState("all");
  const [loading, setLoading] = useState(false);

  const buildVideoQuery = (topicName, subtopicName) =>
    [topicName, subtopicName].filter(Boolean).join(" ");

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    const result = await db
      .select()
      .from(CourseDetails)
      .where(eq(CourseDetails.courseId, courseId));
    const courseData = result[0];
    setCourse(courseData);
    try {
      const roadmapData =
        typeof courseData.roadmap === "string"
          ? JSON.parse(courseData.roadmap)
          : courseData.roadmap ?? [];
      setRoadmap(roadmapData);
      fetchAllLessonVideos(roadmapData, courseData);
    } catch {
      setRoadmap([]);
    }
    setLoading(false);
  };

  const fetchAllLessonVideos = async (roadmapData, courseData) => {
    for (const chapter of roadmapData) {
      for (const lesson of chapter.subtopics) {
        const lessonName = typeof lesson === 'string' ? lesson : lesson.name;
        const lessonKey = `${chapter.title}__${lessonName}`;
        
        const searchQuery = typeof lesson === 'string' 
          ? buildVideoQuery(courseData?.name, lesson) 
          : lesson.youtubeSearchQuery || buildVideoQuery(courseData?.name, lesson.name);

        try {
          const videos = await getVideos(searchQuery);
          setLessonVideos(prev => ({ ...prev, [lessonKey]: videos }));
        } catch (error) {
          console.error("Failed to fetch video for", lessonKey, error);
          setLessonVideos(prev => ({ ...prev, [lessonKey]: [] }));
        }
      }
    }
  };

  const router = require('next/navigation').useRouter();

  const saveSelectedVideos = async () => {
    setLoading(true);
    await db.delete(CourseVideos).where(eq(CourseVideos.courseId, courseId));
    const videoInserts = [];
    for (const [lessonKey, video] of Object.entries(selectedVideos)) {
      if (video) {
        videoInserts.push({
          courseId,
          chapterTitle: lessonKey.split("__")[0],
          subtopicName: lessonKey.split("__")[1],
          videoData: video,
        });
      }
    }
    if (videoInserts.length > 0) {
      await db.insert(CourseVideos).values(videoInserts);
    }
    toast.success("Videos saved successfully!");
    router.push(`/dashboard/learnCourse/${courseId}`);
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-background">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-2xl text-foreground">Choose Videos</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/learnCourse/${courseId}`)}>
            Skip
          </Button>
          <Button size="sm" onClick={saveSelectedVideos} disabled={Object.keys(selectedVideos).length === 0 || loading}>
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground text-center">
          Course: {course ? course.name : "Select a course"}
        </p>
      </div>

      <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All Videos</TabsTrigger>
          <TabsTrigger value="selected">
            {Object.keys(selectedVideos).length} Selected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Accordion type="single" collapsible defaultValue="chapter-0" className="w-full space-y-4">
            {roadmap.map((chapter, cIndex) => (
              <AccordionItem key={cIndex} value={`chapter-${cIndex}`} className="border rounded-xl px-5 bg-card shadow-sm">
                <AccordionTrigger className="text-lg font-bold hover:no-underline">{chapter.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    {chapter.subtopics.map((lessonObj, lIndex) => {
                      const lessonName = typeof lessonObj === 'string' ? lessonObj : lessonObj.name;
                      const lessonKey = `${chapter.title}__${lessonName}`;
                      const videos = lessonVideos[lessonKey] || [];
                      return (
                        <div
                          key={lessonKey}
                          className="border rounded-lg p-4 bg-muted/30"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full capitalize">{lessonName}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                            {videos.map((video, vIdx) => {
                              const selectedVidId = selectedVideos[lessonKey]?.id?.videoId || selectedVideos[lessonKey]?.id;
                              const currentVidId = video.id?.videoId || video.id;
                              const isSelected = selectedVidId === currentVidId && currentVidId;
                              return (
                                <div
                                  key={vIdx}
                                  className="bg-background border rounded-lg p-3 flex flex-col"
                                >
                                  <img
                                    src={video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || "/placeholder.jpg"}
                                    alt={video.snippet?.title || "Video"}
                                    className="w-full h-28 object-cover rounded-md mb-2 bg-muted"
                                  />
                                  <div className="text-xs font-medium text-foreground line-clamp-2 mb-1" dangerouslySetInnerHTML={{ __html: video.snippet?.title || "Selected Video" }}></div>
                                  <div className="text-xs text-muted-foreground mb-3">
                                    {video.snippet?.channelTitle || "Unknown"}
                                  </div>
                                  <Button
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className="mt-auto w-full"
                                    onClick={() => setSelectedVideos(prev => ({ ...prev, [lessonKey]: video }))}
                                  >
                                    {isSelected ? "Selected" : "Select"}
                                  </Button>
                                </div>
                              );
                            })}
                            {videos.length === 0 && (
                              <div className="text-sm text-muted-foreground py-4 px-2">
                                No videos found.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="selected">
          {Object.keys(selectedVideos).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No videos selected yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(selectedVideos).map(([lessonKey, video]) => {
                if (!video) return null;
                const [chapterTitle, subtopicName] = lessonKey.split("__");
                const thumbnailUrl = video?.snippet?.thumbnails?.medium?.url || video?.snippet?.thumbnails?.default?.url;
                return (
                  <div
                    key={lessonKey}
                    className="border rounded-lg p-3 bg-card shadow-sm flex flex-col"
                  >
                    <div className="text-xs font-bold text-primary mb-2 line-clamp-1">{chapterTitle}: {subtopicName}</div>
                    <img
                      src={thumbnailUrl || "/placeholder.jpg"}
                      alt={video?.snippet?.title || "Selected video"}
                      className="w-full h-28 object-cover rounded-md mb-2 bg-muted"
                    />
                    <div className="text-xs font-medium text-foreground line-clamp-2 mb-3" dangerouslySetInnerHTML={{ __html: video?.snippet?.title || "Selected Video" }}></div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-auto w-full"
                      onClick={() => setSelectedVideos(prev => { const updated = {...prev}; delete updated[lessonKey]; return updated; })}
                    >
                      Deselect
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


