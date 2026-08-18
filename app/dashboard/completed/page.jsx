"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { db } from "@/services/db";
import { CourseDetails } from "@/services/schema";
import { eq } from "drizzle-orm";
import { useRouter } from "next/navigation";
import LoadingDialouge from "../../createCourse/_components/LoadingDialouge";
import { CourseCard } from "@/components/ui/course-card";
import toast from "react-hot-toast";
import { EmptyState } from "@/components/ui/empty-state";

function CompletedCourses() {
  const [certificateLoading, setCertificateLoading] = useState({});
  const { user } = useUser();
  const [courses, setCourses] = useState([]);
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
  const [progress, setProgress] = useState({});
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
        const roadmap = typeof course.roadmap === "string" ? JSON.parse(course.roadmap) : course.roadmap;
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

  const completedCourses = courses.filter((course) => progress[course.courseId] === 100);

  const handleCertificateRequest = async (course) => {
    setCertificateLoading((prev) => ({ ...prev, [course.courseId]: true }));
    try {
      const genResponse = await fetch("/api/genCertificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.courseId,
          courseName: course.name,
          userName: user?.fullName || user?.firstName || "Student",
          userEmail: user?.emailAddresses[0]?.emailAddress,
        }),
      });
      const genData = await genResponse.json();
      if (!genResponse.ok) {
        toast.error(genData.error || "Failed to generate certificate");
        return;
      }
      const sendResponse = await fetch("/api/sendCertificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateId: genData.certificateId,
          pdfBase64: genData.pdfBase64,
          userEmail: user?.emailAddresses[0]?.emailAddress,
          userName: user?.fullName || user?.firstName || "Student",
          courseName: course.name,
        }),
      });
      const sendData = await sendResponse.json();
      if (sendResponse.ok) {
        toast.success(
          `Certificate sent successfully! Check your email: ${user?.emailAddresses[0]?.emailAddress}`
        );
      } else {
        toast.error(sendData.error || "Failed to send certificate");
      }
    } catch (error) {
      console.error("Certificate error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCertificateLoading((prev) => ({ ...prev, [course.courseId]: false }));
    }
  };

  return (
    <>
      <LoadingDialouge loading={loading} activeStep={2} />
      <div>
        <h1 className="text-2xl font-bold mb-1">Completed Courses</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Courses you have finished and can get certificates for
        </p>
        {!loading && completedCourses.length === 0 ? (
          <EmptyState
            title="No completed courses"
            description="Complete a course to see it here and get your certificate."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedCourses.map((course) => (
              <CourseCard
                key={course.courseId}
                course={course}
                completionBadge={true}
                onView={(courseId) => router.push(`/dashboard/learnCourse/${courseId}`)}
                actionLabel="Get Certificate"
                actionLoading={certificateLoading[course.courseId]}
                onAction={handleCertificateRequest}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default CompletedCourses;
