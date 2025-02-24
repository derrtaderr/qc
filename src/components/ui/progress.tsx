import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = "Progress"

export interface AnalysisProgressProps {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  currentStep: string;
  error?: string;
  onCancel?: () => void;
}

export function AnalysisProgress({
  status,
  progress,
  currentStep,
  error,
  onCancel,
}: AnalysisProgressProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {status === 'processing' && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="font-medium">
            {status === 'idle' && 'Ready to analyze'}
            {status === 'processing' && currentStep}
            {status === 'success' && 'Analysis complete'}
            {status === 'error' && 'Analysis failed'}
          </span>
        </div>
        {status === 'processing' && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-red-500 hover:text-red-600"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      <Progress value={progress} className="w-full" />

      {error && (
        <div className="text-sm text-red-500 mt-2">
          {error}
        </div>
      )}
    </div>
  )
}

export { Progress } 