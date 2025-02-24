import { TextAnalysisService, TextAnalysisResult } from './text-analysis';
import { VisualAnalysisService, VisualAnalysisResult } from './visual';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAnalysisStore } from '@/lib/stores/analysis';

export interface AnalysisResult {
  text: TextAnalysisResult;
  visual: VisualAnalysisResult;
  error?: string;
}

export class AnalysisService {
  static async analyzePDF(file: File): Promise<AnalysisResult> {
    const analysisStore = useAnalysisStore.getState();
    const { settings } = useSettingsStore.getState();
    
    try {
      // Validate file
      if (!file.type.includes('pdf')) {
        throw new Error('Invalid file type. Please upload a PDF file.');
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit.');
      }

      // Initialize result
      const result: AnalysisResult = {
        text: { content: '', issues: [] },
        visual: {
          fonts: [],
          lineAlignment: { misalignments: [] },
          spacing: { inconsistencies: [] },
          anomalies: [],
        },
      };

      // Start analysis
      analysisStore.setStatus('processing');

      // Text Analysis
      if (settings.textQC) {
        try {
          analysisStore.setCurrentStep('text-extraction');
          const textResult = await TextAnalysisService.analyzeText(file);
          result.text = textResult;
          
          if (textResult.error) {
            console.error('Text analysis error:', textResult.error);
          }
          
          analysisStore.setStep('text-extraction', {
            status: textResult.error ? 'error' : 'completed',
            progress: 100,
          });
        } catch (error) {
          console.error('Text analysis failed:', error);
          analysisStore.setStep('text-extraction', {
            status: 'error',
            progress: 0,
          });
        }
      }

      // Visual Analysis
      if (settings.visualQC) {
        try {
          analysisStore.setCurrentStep('visual-analysis');
          const visualResult = await VisualAnalysisService.analyzePDF(file);
          result.visual = visualResult;
          
          if (visualResult.error) {
            console.error('Visual analysis error:', visualResult.error);
          }
          
          analysisStore.setStep('visual-analysis', {
            status: visualResult.error ? 'error' : 'completed',
            progress: 100,
          });
        } catch (error) {
          console.error('Visual analysis failed:', error);
          analysisStore.setStep('visual-analysis', {
            status: 'error',
            progress: 0,
          });
        }
      }

      // Check for critical errors
      const hasTextError = settings.textQC && result.text.error;
      const hasVisualError = settings.visualQC && result.visual.error;
      
      if (hasTextError && hasVisualError) {
        throw new Error('Both text and visual analysis failed.');
      }

      // Set final status
      analysisStore.setStatus(
        hasTextError || hasVisualError ? 'error' : 'success',
        hasTextError || hasVisualError
          ? 'Some analysis features failed. Check the results for details.'
          : undefined
      );

      return result;
    } catch (error) {
      // Handle critical errors
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      analysisStore.setStatus('error', errorMessage);
      
      return {
        text: { content: '', issues: [], error: errorMessage },
        visual: {
          fonts: [],
          lineAlignment: { misalignments: [] },
          spacing: { inconsistencies: [] },
          anomalies: [],
          error: errorMessage,
        },
        error: errorMessage,
      };
    }
  }

  static async cancelAnalysis(): Promise<void> {
    const analysisStore = useAnalysisStore.getState();
    analysisStore.setStatus('idle');
    analysisStore.reset();
  }
} 