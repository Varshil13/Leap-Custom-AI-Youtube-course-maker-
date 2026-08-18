import React from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const courseGradients = [
  "from-indigo-500/20 via-purple-500/20 to-pink-500/20",
  "from-amber-500/20 via-orange-500/20 to-red-500/20",
  "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
  "from-rose-500/20 via-pink-500/20 to-fuchsia-500/20",
  "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
];

export function CourseCard({
  course,
  progress: courseProgress = 0,
  onView,
  onDelete,
  showDelete = false,
  deleteLoading = false,
  completionBadge = false,
  actionLabel,
  actionLoading = false,
  onAction,
  actionVariant = "default",
}) {
  const colorIdx = (course?.courseId || "").charCodeAt(0) % courseGradients.length;

  return (
    <Card className="overflow-hidden group transition-shadow duration-200 hover:shadow-lg">
      <div
        className={cn(
          "h-32 w-full flex items-center justify-center bg-gradient-to-br",
          courseGradients[colorIdx]
        )}
      >
        <BookOpen size={48} className="text-primary/50" />
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground truncate">{course?.name}</h3>
          {course?.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
          )}
        </div>
        {completionBadge ? (
          <Badge variant="secondary" className="text-xs">
            100% completed
          </Badge>
        ) : (
          <div className="space-y-1">
            <Progress value={courseProgress} className="h-2" />
            <span className="text-xs font-medium text-muted-foreground">
              {courseProgress}% completed
            </span>
          </div>
        )}
        <div className="flex gap-2">
          {onView && (
            <Button
              size="sm"
              variant={onAction ? "outline" : "default"}
              className="flex-1"
              onClick={() => onView(course.courseId)}
            >
              View Course
            </Button>
          )}
          {onAction && (
            <Button
              size="sm"
              variant={actionVariant}
              className="flex-1"
              onClick={() => onAction(course)}
              disabled={actionLoading}
            >
              {actionLoading ? "Sending..." : actionLabel}
            </Button>
          )}
          {showDelete && onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(course.courseId)}
              disabled={deleteLoading}
            >
              {deleteLoading ? "..." : "Remove"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
