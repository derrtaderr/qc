import { create } from 'zustand'
import { AnalysisStep } from '@/components/analysis/progress-interface'

interface AnalysisState {
  steps: AnalysisStep[];
  currentStep: string;
  overallProgress: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
  setStep: (stepId: string, updates: Partial<AnalysisStep>) => void;
  setCurrentStep: (stepId: string) => void;
  setOverallProgress: (progress: number) => void;
  setStatus: (status: AnalysisState['status'], error?: string) => void;
  reset: () => void;
}

const initialSteps: AnalysisStep[] = [
  {
    id: 'text-extraction',
    name: 'Text Extraction',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'ocr-processing',
    name: 'OCR Processing',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'visual-analysis',
    name: 'Visual Analysis',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'content-validation',
    name: 'Content Validation',
    status: 'pending',
    progress: 0,
  },
]

export const useAnalysisStore = create<AnalysisState>((set) => ({
  steps: initialSteps,
  currentStep: '',
  overallProgress: 0,
  status: 'idle',
  
  setStep: (stepId, updates) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    })),
    
  setCurrentStep: (stepId) =>
    set((state) => ({
      currentStep: stepId,
      steps: state.steps.map((step) => ({
        ...step,
        status:
          step.id === stepId
            ? 'processing'
            : state.steps.find((s) => s.id === step.id)?.status || 'pending',
      })),
    })),
    
  setOverallProgress: (progress) =>
    set(() => ({
      overallProgress: progress,
    })),
    
  setStatus: (status, error) =>
    set(() => ({
      status,
      error,
    })),
    
  reset: () =>
    set(() => ({
      steps: initialSteps,
      currentStep: '',
      overallProgress: 0,
      status: 'idle',
      error: undefined,
    })),
})) 