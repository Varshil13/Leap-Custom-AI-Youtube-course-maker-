"use client"
import { useEffect, useState } from "react";
import LoadingDialouge from "../../createCourse/_components/LoadingDialouge";
import { db } from "@/services/db";
import { CourseDetails, CourseVideos } from "@/services/schema";
import { eq } from "drizzle-orm";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { EmptyState } from "@/components/ui/empty-state";

export const invalidateProgressCache = (courseId) => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('progressCache');
      if (cached) {
        const obj = JSON.parse(cached);
        delete obj[courseId];
        localStorage.setItem('progressCache', JSON.stringify(obj));
      }
    } catch {}
  }
};

function Showcourses() {
  const [deregisterLoading, setDeregisterLoading] = useState({});
  const handleDeregister = async (courseId) => {
    if (!window.confirm('Are you sure you want to deregister from this course? This action cannot be undone.')) return;
    try {
      setDeregisterLoading(prev => ({ ...prev, [courseId]: true }));
      const res = await fetch(`/api/deleteCourse?courseId=${courseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to deregister');
      setCourses(prev => prev.filter(c => c.courseId !== courseId));
      invalidateProgressCache(courseId);
      setProgress(prev => {
        const newP = { ...prev };
        delete newP[courseId];
        return newP;
      });
      toast.success('Successfully deregistered from course.');
    } catch (e) {
      toast.error('Failed to deregister.');
    } finally {
      setDeregisterLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const { user } = useUser();
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [progressCache, setProgressCache] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('progressCache');
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    }
    return {};
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAll = async () => {
      if (user?.id) {
        setLoading(true);
        const fetchedCourses = await fetchCourses();
        await fetchAllProgress(fetchedCourses);
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const handleCourseClick = (courseId) => {
    router.push(`/dashboard/learnCourse/${courseId}`);
  }

  const fetchCourses = async () => {
    const result = await db
      .select()
      .from(CourseDetails)
      .where(eq(CourseDetails.createdBy, user.emailAddresses[0].emailAddress));
    setCourses(result);
    return result;
  };

  const fetchAllProgress = async (fetchedCourses) => {
    const progressObj = { ...progressCache };
    for (const course of fetchedCourses) {
      if (progressObj[course.courseId] !== undefined) continue;
      const res = await fetch(`/api/progress?courseId=${course.courseId}`);
      if (!res.ok) continue;
      const data = await res.json();
      const watchedCount = Object.values(data.progress || {}).filter(Boolean).length;
      let totalLessons = 0;
      try {
        const roadmap = typeof course.roadmap === 'string' ? JSON.parse(course.roadmap) : course.roadmap;
        totalLessons = roadmap?.reduce((sum, ch) => sum + (ch.subtopics?.length || 0), 0) || 0;
      } catch {
        totalLessons = 0;
      }
      const percent = totalLessons > 0 ? Math.round((watchedCount / totalLessons) * 100) : 0;
      progressObj[course.courseId] = percent;
    }
    setProgress(progressObj);
    setProgressCache(progressObj);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('progressCache', JSON.stringify(progressObj));
      } catch {}
    }
  };

  const sortedCourses = [...courses]
    .filter(course => progress[course.courseId] !== 100)
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

  return (
    <>
      <LoadingDialouge loading={loading} activeStep={2} />
      {courses.length === 0 && !loading ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to get started."
          action={
            <Button onClick={() => router.push('/createCourse')}>
              Create Course
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCourses.map((course) => {
            const courseProgress = progress[course.courseId] || 0;
            return (
              <Card key={course.courseId} className="overflow-hidden">
                <div className="h-32 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  {course.name?.charAt(0) || '?'}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground truncate">{course.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full rounded-full h-2 bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {courseProgress}% completed
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCourseClick(course.courseId)}
                    >
                      View Course
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeregister(course.courseId)}
                      disabled={deregisterLoading[course.courseId]}
                    >
                      {deregisterLoading[course.courseId] ? '...' : 'Remove'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export default Showcourses;
