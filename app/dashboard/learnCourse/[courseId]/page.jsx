'use client';
import React, { useEffect, useState } from "react";
import { invalidateProgressCache } from "../../_components/Showcourses";
import { useParams } from "next/navigation";
import { db } from "@/services/db";
import { CourseDetails, CourseVideos, CourseContent } from "@/services/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import { extractJsonArray } from "@/app/_utils/extractJsonArray";
import { useUser } from "@clerk/nextjs";
import LaTeXRenderer from "@/app/_components/LaTeXRenderer";
import 'katex/dist/katex.min.css';






function LearnCoursePage() {
  const { courseId } = useParams();
  const { user } = useUser();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [courseContent, setCourseContent] = useState([]);
  // Track watched state per lessonKey, now persisted
  const [watched, setWatched] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentCache, setContentCache] = useState({});

  useEffect(() => {
    if (courseId && user) {
      fetchCourse();
      fetchCourseContent();
      loadProgress();
    }
  }, [courseId, user]);
  // Load user progress from API
  const loadProgress = async () => {
    try {
      setLoadingProgress(true);
      const response = await fetch(`/api/progress?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setWatched(data.progress || {});
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoadingProgress(false);
    }
  };


  // Save progress to API
  const saveProgress = async (chapterTitle, subtopicName, isWatched) => {
    try {
      
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          chapterTitle,
          subtopicName,
          isWatched,
        }),
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  // Toggle watched state and persist
  const toggleWatched = async (lessonKey) => {
    const [chapterTitle, subtopicName] = lessonKey.split("__");
    const newWatched = !watched[lessonKey];
    setWatched(prev => ({ ...prev, [lessonKey]: newWatched }));
    await saveProgress(chapterTitle, subtopicName, newWatched);
    // Invalidate dashboard progress cache for this course
    invalidateProgressCache(courseId);
  };


  
  // Fetch course content from DB
  const fetchCourseContent = async () => {
    const rows = await db
      .select()
      .from(CourseContent)
      .where(eq(CourseContent.courseId, courseId));
    setCourseContent(Array.isArray(rows) ? rows : []);
  };

  // Check if content exists for a specific subtopic
  const getContentForSubtopic = (chapterTitle, subtopicName) => {
    // First check database content
    const dbContent = courseContent.find(
      (row) => row.chapterTitle === chapterTitle && row.subtopicName === subtopicName
    );
    if (dbContent?.contentData?.content) return dbContent;

    // Then check cache
    const cacheKey = `${chapterTitle}__${subtopicName}`;
    const cachedContent = contentCache[cacheKey];
    if (cachedContent) return { contentData: { content: cachedContent } };

    // Check localStorage cache
    try {
      const localCache = localStorage.getItem(`course_content_${courseId}_${cacheKey}`);
      if (localCache) {
        const content = JSON.parse(localCache);
        setContentCache(prev => ({ ...prev, [cacheKey]: content }));
        return { contentData: { content } };
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }

    return null;
  };

  // Generate content for a specific subtopic
  const generateSubtopicContent = async (chapterTitle, subtopicName) => {
    const cacheKey = `${chapterTitle}__${subtopicName}`;
    
    try {
      setGeneratingContent(true);

      // Get course info for context
      const language = course?.description?.toLowerCase().includes('python') ? 'python' :
                      course?.description?.toLowerCase().includes('java') ? 'java' :
                      course?.description?.toLowerCase().includes('cpp') ? 'cpp' :
                      course?.description?.toLowerCase().includes('javascript') ? 'javascript' : 'general';

      const response = await fetch('/api/genSubtopicContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: course?.name || 'Programming Course',
          courseDescription: course?.description || '',
          level: course?.level || 'Beginner',
          chapterTitle,
          subtopicName,
          language
        })
      });

      if (!response.ok) throw new Error('Failed to generate content');

      const data = await response.json();
      
      // Extract content from AI response - now expecting direct LaTeX
      let content = data.text;

      // Clean up any potential JSON wrapper if present
      if (content.startsWith('{') && content.endsWith('}')) {
        try {
          const parsed = JSON.parse(content);
          content = parsed.content || content;
        } catch {
          // If JSON parsing fails, use as is
        }
      }

      // Clean up LaTeX content
      content = content.trim();

      // Save to database
      await db.insert(CourseContent).values({
        courseId,
        chapterTitle,
        subtopicName,
        contentData: { content }
      });

      // Update local state
      setCourseContent(prev => [...prev, {
        courseId,
        chapterTitle,
        subtopicName,
        contentData: { content }
      }]);

      // Cache in memory and localStorage
      setContentCache(prev => ({ ...prev, [cacheKey]: content }));
      localStorage.setItem(`course_content_${courseId}_${cacheKey}`, JSON.stringify(content));
      
      return content;

    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    } finally {
      setGeneratingContent(false);
    }
  };

 

  const fetchCourse = async () => {
    // Fetch course details
    const result = await db
      .select()
      .from(CourseDetails)
      .where(eq(CourseDetails.courseId, courseId));
    const courseData = result[0];
    setCourse(courseData);
    // Parse roadmap
    let roadmapData = [];
    try {
      roadmapData = courseData?.roadmap
        ? (typeof courseData.roadmap === "string"
            ? JSON.parse(courseData.roadmap)
            : courseData.roadmap)
        : [];
    } catch {
      roadmapData = [];
    }
    setRoadmap(Array.isArray(roadmapData) ? roadmapData : []);
    // Fetch videos
    const videoRows = await db
      .select()
      .from(CourseVideos)
      .where(eq(CourseVideos.courseId, courseId));
    setVideos(Array.isArray(videoRows) ? videoRows : []);
  };

  // Helper to get video for selected chapter/subtopic
  const getVideoForKey = (chapterTitle, subtopicName) => {
    return videos.find(v => v.chapterTitle === chapterTitle && v.subtopicName === subtopicName)?.videoData;
  };

  // Sidebar: chapters/subtopics
  return (
  <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 shadow-lg border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <a href="/dashboard" className="text-xs text-primary hover:underline mb-2 inline-block">
            &larr; Back to Dashboard
          </a>
          <h2 className="font-bold text-lg text-sidebar-foreground">Course Content</h2>
          {course && (
            <div className="mt-2">
              <p className="text-sm font-medium text-muted-foreground">{course.name}</p>
              <div className="flex items-center mt-1">
                <div className="w-full rounded-full h-2 bg-muted">
                  <div 
                    className="h-2 rounded-full transition-all duration-300 bg-primary" 
                    style={{ 
                      width: `${roadmap.length > 0 
                        ? (Object.keys(watched).filter(key => watched[key]).length / 
                           roadmap.reduce((total, chapter) => total + (chapter.subtopics?.length || 0), 0)) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="ml-3 text-xs whitespace-nowrap text-muted-foreground">
                  {Object.keys(watched).filter(key => watched[key]).length} / {roadmap.reduce((total, chapter) => total + (chapter.subtopics?.length || 0), 0)}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-140px)] p-4">
          {roadmap.map((chapter, idx) => {
            const chapterWatched = (chapter.subtopics || []).filter(
              sub => watched[`${chapter.title}__${sub}`]
            ).length;
            const chapterTotal = (chapter.subtopics || []).length;
            const isChapterComplete = chapterTotal > 0 && chapterWatched === chapterTotal;
            return (
            <div key={idx} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isChapterComplete ? 'bg-accent text-white' : 'bg-primary text-white'
                  }`}>
                    {isChapterComplete ? '✓' : idx + 1}
                  </div>
                  <div className="font-semibold text-sm text-sidebar-foreground">{chapter.title}</div>
                </div>
                <ul className="ml-10 space-y-1">
                {(chapter.subtopics || []).map((subtopic, sidx) => {
                  const lessonKey = `${chapter.title}__${subtopic}`;
                  const isWatched = watched[lessonKey];
                  const isActive = selectedKey === lessonKey;
                  return (
                    <li
                      key={sidx}
                      className={`cursor-pointer px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                      onClick={() => setSelectedKey(lessonKey)}
                    >
                      <span className="flex-1">{subtopic}</span>
                      {isWatched && (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-primary-foreground text-primary' : 'bg-accent text-white'
                        }`}>
                          <span className="text-xs">✓</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            );
          })}
        </div>
      </div>
               
      {/* Main section: show video */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto p-8">
          {!selectedKey && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Welcome to Your Course</h3>
              <p className="text-muted-foreground">Select a lesson from the sidebar to start learning</p>
            </div>
          )}
            {selectedKey && (() => {
              // Find chapter/subtopic
              const [chapterTitle, subtopicName] = selectedKey.split("__");
              const videoData = getVideoForKey(chapterTitle, subtopicName);
              // Find course content for this subtopic
              const contentRow = getContentForSubtopic(chapterTitle, subtopicName);
              // Find chapter explanation (where subtopicName === chapterTitle)
              const chapterExplanation = getContentForSubtopic(chapterTitle, chapterTitle);
              if (!videoData) return <div className="text-muted-foreground">No video found for this subtopic.</div>;
              if (videoData.skipped) return <div className="text-muted-foreground">This subtopic was skipped.</div>;
              let videoSection = null;
              if (videoData.customUrl) {
                // Extract YouTube video ID from URL
                const url = videoData.customUrl;
                let vidId = "";
                try {
                  const urlObj = new URL(url);
                  if (urlObj.searchParams.get("v")) {
                    vidId = urlObj.searchParams.get("v");
                  } else if (urlObj.pathname.startsWith("/embed/")) {
                    vidId = urlObj.pathname.split("/embed/")[1];
                  } else if (urlObj.pathname.startsWith("/watch/")) {
                    vidId = urlObj.pathname.split("/watch/")[1];
                  } else {
                    vidId = url.split("v=")[1] || url;
                  }
                } catch {
                  vidId = url.split("v=")[1] || url;
                }
                videoSection = (
                  <iframe
                    width="100%"
                    height="400"
                    src={`https://www.youtube.com/embed/${vidId}`}
                    title="Custom Video"
                    frameBorder="0"
                    allowFullScreen
                    className="rounded"
                  />
                );
              } else {
                // Standard YouTube video
                const vidId = videoData.id?.videoId || videoData.id;
                videoSection = (
                  <iframe
                    width="100%"
                    height="400"
                    src={`https://www.youtube.com/embed/${vidId}`}
                    title={videoData.snippet?.title || subtopicName}
                    frameBorder="0"
                    allowFullScreen
                    className="rounded"
                  />
                );
              }
              return (
                <div className="w-full">
                  {/* Video Header with Title and Watched Checkbox */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-2xl font-bold mb-1 text-foreground">{subtopicName}</h1>
                      <p className="text-sm text-muted-foreground">{chapterTitle}</p>
                    </div>
                    <label
                      className="flex items-center gap-2 cursor-pointer select-none px-4 py-2 rounded-lg border border-border bg-muted transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!watched[selectedKey]}
                        onChange={() => toggleWatched(selectedKey)}
                        className="accent-primary w-5 h-5"
                        disabled={loadingProgress}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {loadingProgress ? "Saving..." : "Mark as Watched"}
                      </span>
                    </label>
                  </div>

                  {/* Video Player */}
                  <div className="rounded-xl overflow-hidden shadow-lg mb-8 bg-black">
                    {videoSection}
                  </div>

                  {/* Video Details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 text-foreground">
                      {videoData.snippet?.title || subtopicName}
                    </h3>
                    {videoData.snippet?.channelTitle && (
                      <p className="text-sm mb-4 text-muted-foreground">By {videoData.snippet.channelTitle}</p>
                    )}
                  </div>

                  {/* Chapter Introduction */}
                  {subtopicName === chapterTitle && (
                    <div className="mb-8 p-8 rounded-lg bg-muted border-l-4 border-primary">
                      <h4 className="text-xl font-semibold mb-4 text-primary">Chapter Overview</h4>
                      {chapterExplanation && chapterExplanation.contentData?.content ? (
                        <LaTeXRenderer content={chapterExplanation.contentData.content} />
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground mb-3">
                            Chapter overview content not generated yet.
                          </p>
                          <Button
                            onClick={async () => {
                              try {
                                await generateSubtopicContent(chapterTitle, chapterTitle);
                              } catch (error) {
                                console.error('Failed to generate chapter content:', error);
                                alert('Failed to generate chapter content. Please try again.');
                              }
                            }}
                            size="sm"
                          >
                            Generate Chapter Overview
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lesson Content */}
                  <div className="p-8 rounded-lg border bg-muted border-border">
                    <h4 className="text-xl font-semibold mb-4 text-foreground">Lesson Content</h4>
                    {generatingContent ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground">Generating content for this lesson...</p>
                        </div>
                      </div>
                    ) : contentRow && contentRow.contentData?.content ? (
                      <LaTeXRenderer content={contentRow.contentData.content} />
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-8">
                        <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                          <span className="text-2xl">📝</span>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground mb-3">
                            Content for this lesson hasn't been generated yet.
                          </p>
                          <Button
                            onClick={async () => {
                              try {
                                await generateSubtopicContent(chapterTitle, subtopicName);
                              } catch (error) {
                                console.error('Failed to generate content:', error);
                                alert('Failed to generate content. Please try again.');
                              }
                            }}
                            className="px-6 py-2"
                          >
                            Generate Content
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Next/Previous Lesson Navigation */}
                  {(() => {
                    const flatLessons = roadmap.flatMap(ch =>
                      (ch.subtopics || []).map(sub => ({ chapter: ch.title, subtopic: sub }))
                    );
                    const currentIdx = flatLessons.findIndex(
                      l => l.chapter === chapterTitle && l.subtopic === subtopicName
                    );
                    const prev = currentIdx > 0 ? flatLessons[currentIdx - 1] : null;
                    const next = currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null;
                    return (
                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                        {prev ? (
                          <Button
                            variant="outline"
                            onClick={() => setSelectedKey(`${prev.chapter}__${prev.subtopic}`)}
                            className="flex items-center gap-2"
                          >
                            <span>&larr;</span>
                            <span className="hidden sm:inline">{prev.subtopic}</span>
                            <span className="sm:hidden">Previous</span>
                          </Button>
                        ) : <div />}
                        {next ? (
                          <Button
                            onClick={() => setSelectedKey(`${next.chapter}__${next.subtopic}`)}
                            className="flex items-center gap-2"
                          >
                            <span className="hidden sm:inline">{next.subtopic}</span>
                            <span className="sm:hidden">Next</span>
                            <span>&rarr;</span>
                          </Button>
                        ) : (
                          <div className="text-sm text-muted-foreground font-medium">
                            🎉 Course complete!
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}

export default LearnCoursePage;