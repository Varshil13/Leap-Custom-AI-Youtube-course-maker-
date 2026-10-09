"use client"
import { useEffect, useState } from "react";
import LoadingDialouge from "../../createCourse/_components/LoadingDialouge";
import { db } from "@/services/db";
import { CourseDetails, CourseVideos } from "@/services/schema";
import { eq } from "drizzle-orm";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CourseCard } from "@/components/ui/course-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmDeregister = async () => {
    if (!deleteTarget) return;
    const courseId = deleteTarget;
    setDeleteTarget(null);
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
      setDeregisterLoading(prev => ({ ...prev, [deleteTarget]: false }));
    }
  };

  const { data: session } = useSession();
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
      if (session?.user?.email) {
        setLoading(true);
        const fetchedCourses = await fetchCourses();
        await fetchAllProgress(fetchedCourses);
        setLoading(false);
      }
    };
    fetchAll();
  }, [session?.user?.email]);

  const handleCourseClick = (courseId) => {
    router.push(`/dashboard/learnCourse/${courseId}`);
  }

  const fetchCourses = async () => {
    const result = await db
      .select()
      .from(CourseDetails)
      .where(eq(CourseDetails.createdBy, session?.user?.email));
    setCourses(result);
    return result;
  };

  const fetchAllProgress = async (fetchedCourses) => {
    const progressObj = { ...progressCache };
    
    const fetchPromises = fetchedCourses.map(async (course) => {
      if (progressObj[course.courseId] !== undefined) return;
      try {
        const res = await fetch(`/api/progress?courseId=${course.courseId}`);
        if (!res.ok) return;
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
      } catch (e) {
        console.error("Error fetching progress for course", course.courseId, e);
      }
    });

    await Promise.all(fetchPromises);
    
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove course?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deregister from this course? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeregister} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <CourseCard
                key={course.courseId}
                course={course}
                progress={courseProgress}
                onView={handleCourseClick}
                onDelete={setDeleteTarget}
                showDelete={true}
                deleteLoading={deregisterLoading[course.courseId]}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

export default Showcourses;
