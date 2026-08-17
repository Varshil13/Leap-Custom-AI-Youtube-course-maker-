import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function ErrorState({ title = "Something went wrong", description, onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 gap-4 text-center", className)}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-destructive/10 text-destructive">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

export { ErrorState };
