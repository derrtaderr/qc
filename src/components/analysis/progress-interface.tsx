import * as React from "react"
import { Card } from "@/components/ui/card"
import { AnalysisProgress } from "@/components/ui/progress"

export interface AnalysisStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

export interface AnalysisProgressInterfaceProps {
  steps: AnalysisStep[];
  currentStep: string;
  overallProgress: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
  onCancel?: () => void;
}

export function AnalysisProgressInterface({
  steps,
  currentStep,
  overallProgress,
  status,
  error,
  onCancel,
}: AnalysisProgressInterfaceProps) {
  return (
    <Card className="w-full p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Analysis Progress</h2>
        
        {/* Overall Progress */}
        <AnalysisProgress
          status={status}
          progress={overallProgress}
          currentStep={currentStep}
          error={error}
          onCancel={onCancel}
        />
      </div>

      {/* Individual Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    step.status === 'completed'
                      ? 'bg-green-500'
                      : step.status === 'processing'
                      ? 'bg-blue-500'
                      : step.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-300'
                  }`}
                />
                <span className="text-sm font-medium">{step.name}</span>
              </div>
              <span className="text-sm text-gray-500">
                {step.progress}%
              </span>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  step.status === 'completed'
                    ? 'bg-green-500'
                    : step.status === 'processing'
                    ? 'bg-blue-500'
                    : step.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-300'
                }`}
                style={{ width: `${step.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </Card>
  )
} 