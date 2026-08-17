import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";

const stepMessages = {
  0: "Generating your Course Roadmap...",
  1: "Saving roadmap...",
  2: "Fetching your courses...",
  3: "Fetching your progress...",
  "Fetching Videos": "Fetching Videos...",
  "Finishing Course": "Finalising the course. This may take a while...",
};

function LoadingDialouge({ loading, activeStep }) {
  const message = stepMessages[activeStep] || "Please wait...";

  return (
    <AlertDialog open={loading}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogDescription>
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="ds-spinner" />
              <span className="text-lg font-semibold text-foreground">{message}</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default LoadingDialouge;
