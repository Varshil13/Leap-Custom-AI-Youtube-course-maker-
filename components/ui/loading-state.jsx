import { cn } from "@/lib/utils";

function LoadingState({ message = "Loading...", className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 gap-4", className)}>
      <div className="ds-spinner" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export { LoadingState };
