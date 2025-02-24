import { AnalysisService } from '../analysis';
import { TextAnalysisService } from '../text-analysis';
import { VisualAnalysisService } from '../visual';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAnalysisStore } from '@/lib/stores/analysis';

// Mock dependencies
jest.mock('../text-analysis');
jest.mock('../visual');
jest.mock('@/lib/stores/settings');
jest.mock('@/lib/stores/analysis');

describe('AnalysisService', () => {
  const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  
  const mockTextResult = {
    content: 'Sample text content',
    issues: [
      {
        type: 'spelling' as const,
        description: 'Spelling error',
        suggestion: 'correction',
        location: { start: 0, end: 5 },
      },
    ],
  };

  const mockVisualResult = {
    fonts: [{ name: 'Arial', size: 12, count: 1 }],
    lineAlignment: { misalignments: [] },
    spacing: { inconsistencies: [] },
    anomalies: [],
  };

  const mockAnalysisStore = {
    setStatus: jest.fn(),
    setCurrentStep: jest.fn(),
    setStep: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock store states
    (useSettingsStore as jest.Mock).mockReturnValue({
      settings: {
        textQC: true,
        visualQC: true,
      },
    });

    (useAnalysisStore.getState as jest.Mock).mockReturnValue(mockAnalysisStore);

    // Mock service results
    (TextAnalysisService.analyzeText as jest.Mock).mockResolvedValue(mockTextResult);
    (VisualAnalysisService.analyzePDF as jest.Mock).mockResolvedValue(mockVisualResult);
  });

  it('analyzes PDF with both text and visual QC enabled', async () => {
    const result = await AnalysisService.analyzePDF(mockFile);

    expect(result.text).toEqual(mockTextResult);
    expect(result.visual).toEqual(mockVisualResult);
    expect(result.error).toBeUndefined();

    expect(TextAnalysisService.analyzeText).toHaveBeenCalledWith(mockFile);
    expect(VisualAnalysisService.analyzePDF).toHaveBeenCalledWith(mockFile);
    expect(mockAnalysisStore.setStatus).toHaveBeenCalledWith('success', undefined);
  });

  it('skips text analysis when textQC is disabled', async () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      settings: {
        textQC: false,
        visualQC: true,
      },
    });

    await AnalysisService.analyzePDF(mockFile);

    expect(TextAnalysisService.analyzeText).not.toHaveBeenCalled();
    expect(VisualAnalysisService.analyzePDF).toHaveBeenCalled();
  });

  it('skips visual analysis when visualQC is disabled', async () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      settings: {
        textQC: true,
        visualQC: false,
      },
    });

    await AnalysisService.analyzePDF(mockFile);

    expect(TextAnalysisService.analyzeText).toHaveBeenCalled();
    expect(VisualAnalysisService.analyzePDF).not.toHaveBeenCalled();
  });

  it('handles text analysis errors gracefully', async () => {
    const error = 'Text analysis failed';
    (TextAnalysisService.analyzeText as jest.Mock).mockRejectedValue(new Error(error));

    const result = await AnalysisService.analyzePDF(mockFile);

    expect(result.text.error).toBeDefined();
    expect(result.visual).toEqual(mockVisualResult);
    expect(mockAnalysisStore.setStatus).toHaveBeenCalledWith('error', expect.any(String));
  });

  it('handles visual analysis errors gracefully', async () => {
    const error = 'Visual analysis failed';
    (VisualAnalysisService.analyzePDF as jest.Mock).mockRejectedValue(new Error(error));

    const result = await AnalysisService.analyzePDF(mockFile);

    expect(result.text).toEqual(mockTextResult);
    expect(result.visual.error).toBeDefined();
    expect(mockAnalysisStore.setStatus).toHaveBeenCalledWith('error', expect.any(String));
  });

  it('validates PDF file type', async () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const result = await AnalysisService.analyzePDF(invalidFile);

    expect(result.error).toBe('Invalid file type. Please upload a PDF file.');
    expect(mockAnalysisStore.setStatus).toHaveBeenCalledWith('error', expect.any(String));
  });

  it('validates file size', async () => {
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    const result = await AnalysisService.analyzePDF(largeFile);

    expect(result.error).toBe('File size exceeds 10MB limit.');
    expect(mockAnalysisStore.setStatus).toHaveBeenCalledWith('error', expect.any(String));
  });

  it('cancels analysis', async () => {
    await AnalysisService.cancelAnalysis();

    expect(mockAnalysisStore.setStatus).toHaveBeenCalledWith('idle');
    expect(mockAnalysisStore.reset).toHaveBeenCalled();
  });
}); 