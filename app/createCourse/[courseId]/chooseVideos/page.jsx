"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/services/db";
import { CourseDetails } from "@/services/schema";
import getVideos from "@/services/youtube";
import LoadingDialouge from "@/app/createCourse/_components/LoadingDialouge";
import { eq } from "drizzle-orm";
import { CourseVideos } from "@/services/schema";
import toast from "react-hot-toast";


function ChooseVideosPage() {
  const [finishing, setFinishing] = useState(false);
  const params = useParams();
  const courseId = params.courseId;
  const [course, setCourse] = useState(null);
  const [roadmap, setRoadmap] = useState([]);
  const [lessonVideos, setLessonVideos] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState({});
  const [showCustomInput, setShowCustomInput] = useState({});
  const [customUrls, setCustomUrls] = useState({});

  const buildVideoQuery = (topicName, subtopicName) =>
    [topicName, subtopicName].filter(Boolean).join(" ");
  


  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  

  const fetchCourse = async () => {
    setLoading(true);
    // Fetch course details from DB
    
    
    const result = await db
      .select()
      .from(CourseDetails)
      .where(eq(CourseDetails.courseId, courseId));
    const courseData = result[0];
  
    
    setCourse(courseData);
    // Parse roadmap and set
    try {
      const roadmapData =
        typeof courseData.roadmap === "string"
          ? JSON.parse(courseData.roadmap)
          : courseData.roadmap ?? [];
      setRoadmap(roadmapData);
      const existingSelections = await loadExistingVideos(); // Load existing first
      await fetchAllLessonVideos(roadmapData, existingSelections, courseData?.name); // Pass existing to skip API calls
    } catch {
      setRoadmap([]);
    }
    setLoading(false);
  };

  const fetchAllLessonVideos = async (roadmapData, existingSelections = {}, topicName = "") => {
    const videosMap = {};
    for (const chapter of roadmapData) {
      for (const lesson of chapter.subtopics) {
        const lessonKey = `${chapter.title}__${lesson}`;
        
        // Skip YouTube API call if this lesson already has a selected video
        if (existingSelections[lessonKey]) {
          
          videosMap[lessonKey] = []; // Set empty array since we don't need to show other options
          continue;
        }
        
        try {
          const searchQuery = buildVideoQuery(topicName, lesson);
          const videos = await getVideos(searchQuery);
          videosMap[lessonKey] = videos;
        } catch {
          videosMap[lessonKey] = [];
        }
      }
    }
    setLessonVideos(videosMap);
  };





  const saveSelectedVideos = async () => {
    // Delete existing videos for this course
    await db.delete(CourseVideos).where(eq(CourseVideos.courseId, courseId));
    // Insert new video selections
    const videoInserts = [];
    for (const [lessonKey, video] of Object.entries(selectedVideos)) {
      if (video) {
        const [chapterTitle, subtopicName] = lessonKey.split("__");
        videoInserts.push({
          courseId,
          chapterTitle,
          subtopicName,
          videoData: video,
        });
      }
    }
    if (videoInserts.length > 0) {
      await db.insert(CourseVideos).values(videoInserts);
    }
    toast.success("Videos saved successfully!");
  };



const loadExistingVideos = async () => {
  const existingVideos = await db
    .select()
    .from(CourseVideos)
    .where(eq(CourseVideos.courseId, courseId));
  
  const videoMap = {};
  existingVideos.forEach(row => {
    const lessonKey = `${row.chapterTitle}__${row.subtopicName}`;
    videoMap[lessonKey] = row.videoData;
  });
  
  setSelectedVideos(videoMap);
  return videoMap; // Return the map so other functions can use it
};



  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-background">
      <LoadingDialouge loading={loading} activeStep={'Fetching Videos'} />
      <LoadingDialouge loading={finishing} activeStep={'Finishing Course'} />
      <a href="/dashboard" className="text-xs text-primary hover:underline mb-4 inline-block">
        &larr; Back to Dashboard
      </a>
      <h2 className="font-bold text-2xl mb-2 text-center text-foreground">Choose Videos</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Select videos for each lesson in your course
      </p>
      {!course && <div className="text-muted-foreground">Loading course...</div>}
      {course && (
        <>
          <div className="mb-8">
            <h3 className="font-semibold text-lg text-foreground">Course: {course.name}</h3>
            <p className="text-sm text-muted-foreground">{course.description}</p>
          </div>
          <div>
            {roadmap.map((chapter, index) => (
              <div key={index} className="border border-border p-4 rounded-lg mb-3 bg-card">
                <div className="flex items-center gap-3">
                  <h3 className="bg-primary h-10 w-10 rounded-full text-white text-center flex items-center justify-center">
                    {index + 1}
                  </h3>
                  <h3 className="font-medium text-lg text-foreground">{chapter.title}</h3>
                </div>
                <div className="mt-2">
                  <h4 className="font-semibold text-foreground">Lessons:</h4>
                  <ul className="list-inside mt-1">
                    {chapter.subtopics.map((lesson, lessonIndex) => {
                      const lessonKey = `${chapter.title}__${lesson}`;
                      const videos = lessonVideos[lessonKey] || [];
                      return (
                        <li
                          key={lessonIndex}
                          className="text-sm mb-4 text-foreground"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-primary h-7 w-7 rounded-full text-white text-center flex items-center justify-center font-semibold">
                              {lessonIndex + 1}
                            </span>
                            <span className="font-semibold text-foreground">{lesson}</span>
                          </div>
                          <div className="flex gap-4 flex-wrap">
                            {/* Show existing selected video if any */}
                            {selectedVideos[lessonKey] && (
                              <div className="border-2 border-accent rounded-lg p-2 w-48 flex flex-col items-center">
                                <img
                                  src={selectedVideos[lessonKey].snippet?.thumbnails?.medium?.url || "/placeholder.png"}
                                  alt="Selected Video"
                                  className="w-full h-24 object-cover rounded mb-2"
                                />
                                <div className="text-xs mb-1 font-semibold text-accent">
                                  {selectedVideos[lessonKey].snippet?.channelTitle || "Custom Video"}
                                </div>
                                <div className="text-xs mb-2 text-muted-foreground">
                                  {selectedVideos[lessonKey].snippet?.title || selectedVideos[lessonKey].customUrl || "Selected"}
                                </div>
                                <button 
                                  className="px-3 py-1 rounded text-xs bg-accent text-white hover:bg-accent/80 transition-colors"
                                  onClick={async () => {
                                    // Deselect the video
                                    setSelectedVideos(prev => ({ ...prev, [lessonKey]: null }));
                                    
                                    // Re-fetch videos for this lesson if not already available
                                    if (!lessonVideos[lessonKey] || lessonVideos[lessonKey].length === 0) {
                                      try {
                                        const lessonName = lessonKey.split('__')[1];
                                        const searchQuery = buildVideoQuery(course?.name, lessonName);
                                        const videos = await getVideos(searchQuery);
                                        setLessonVideos(prev => ({ ...prev, [lessonKey]: videos }));
                                      } catch (error) {
                                        console.error("Error fetching videos:", error);
                                      }
                                    }
                                  }}
                                >
                                  ✓ Selected
                                </button>
                              </div>
                            )}
                            
                            {/* Show YouTube videos if no selection made */}
                            {!selectedVideos[lessonKey] && videos.length === 0 && (
                              <div className="text-xs text-muted-foreground">
                                No videos found.
                              </div>
                            )}
                            {!selectedVideos[lessonKey] && videos.map((video, vidIdx) => (
                              <div
                                key={vidIdx}
                                className="border border-border rounded-lg p-2 w-48 flex flex-col items-center hover:border-primary cursor-pointer bg-muted transition-colors"
                              >
                                <img
                                  src={video.snippet?.thumbnails?.medium?.url}
                                  alt="Thumbnail"
                                  className="w-full h-24 object-cover rounded mb-2"
                                />
                                <div className="text-xs mb-1 text-foreground">
                                  {video.snippet?.channelTitle}
                                </div>
                                <div className="text-xs mb-2 text-muted-foreground">
                                  {video.snippet?.title}
                                </div>
                                <button 
                                  className="px-3 py-1 rounded text-xs bg-primary text-white hover:bg-primary/80 transition-colors"
                                  onClick={() => setSelectedVideos(prev => ({ ...prev, [lessonKey]: video }))}
                                >
                                  Select
                                </button>
                              </div>
                            ))}
                            
                            {/* Skip and Custom URL buttons */}
                            {!selectedVideos[lessonKey] && (
                              <>
                                <button
                                  className="px-3 py-1 rounded text-xs h-fit bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                  onClick={() => setSelectedVideos(prev => ({ ...prev, [lessonKey]: { skipped: true } }))}
                                >
                                  Skip
                                </button>
                                <button
                                  className="px-3 py-1 rounded text-xs h-fit bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                                  onClick={() => setShowCustomInput(prev => ({ ...prev, [lessonKey]: true }))}
                                >
                                  Add Custom URL
                                </button>
                              </>
                            )}
                            
                            {/* Custom URL input */}
                            {showCustomInput[lessonKey] && (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="text"
                                  placeholder="Paste YouTube URL"
                                  value={customUrls[lessonKey] || ""}
                                  onChange={(e) => setCustomUrls(prev => ({ ...prev, [lessonKey]: e.target.value }))}
                                  className="border border-input rounded px-2 py-1 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                  className="px-2 py-1 rounded text-xs bg-accent text-white hover:bg-accent/80 transition-colors"
                                  onClick={() => {
                                    setSelectedVideos(prev => ({ ...prev, [lessonKey]: { customUrl: customUrls[lessonKey] } }));
                                    setShowCustomInput(prev => ({ ...prev, [lessonKey]: false }));
                                    setCustomUrls(prev => ({ ...prev, [lessonKey]: "" }));
                                  }}
                                >
                                  Save URL
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          
          {/* Only Finish Button */}
          <div className="mt-8 text-center flex gap-4 justify-center">
            <button
              className="px-6 py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary/80 transition-colors"
              onClick={async () => {
                try {
                  setFinishing(true);
                  // Save videos only - content will be generated on-demand
                  await saveSelectedVideos();
                  toast.success("Course setup completed successfully! Content will be generated when you access each lesson.");
                  window.location.href = `/dashboard`;
                } catch (error) {
                  console.error("Error finishing course:", error);
                  toast.error("An error occurred while finishing the course. Please try again.");
                } finally {
                  setFinishing(false);
                }
              }}
              disabled={Object.keys(selectedVideos).length === 0 || finishing}
            >
              {finishing ? "Processing..." : "Finish Course"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChooseVideosPage;
