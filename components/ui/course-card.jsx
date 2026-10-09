import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
  const isCompleted = courseProgress === 100 || completionBadge;

  return (
    <Card className="overflow-hidden group transition-all duration-200 hover:shadow-lg border-border/40 bg-card flex flex-col h-full">
      <div className="relative p-5 w-full bg-[#0a0a0a] border-b border-border/40 flex flex-col justify-center min-h-[96px]">
        {/* Subtle dot matrix pattern (Google/Vercel style) */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
        
        <div className="relative z-10 flex flex-col items-start gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {isCompleted ? "Completed" : courseProgress === 0 ? "Start from" : "Continue from"}
          </span>
          <p className={cn("text-sm font-semibold line-clamp-2", isCompleted ? "text-emerald-400" : "text-cyan-400")}>
            {isCompleted 
              ? "All topics finished" 
              : course?.nextVideoToWatch || "Next Topic"}
          </p>
        </div>
      </div>
      <CardContent className="p-4 flex flex-col flex-grow space-y-3">
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
        <div className="flex gap-2 mt-auto pt-2">
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
