import { OCRService } from '../ocr';
import { PDFService } from '../pdf';
import { createWorker } from 'tesseract.js';

// Mock dependencies
jest.mock('tesseract.js');
jest.mock('../pdf');

describe('OCRService', () => {
  const mockText = 'Recognized text from image';
  const mockConfidence = 95.5;
  const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  const mockImageData = new Uint8Array([1, 2, 3]);

  beforeEach(() => {
    // Mock Tesseract worker
    ;(createWorker as jest.Mock).mockResolvedValue({
      loadLanguage: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
      recognize: jest.fn().mockResolvedValue({
        data: {
          text: mockText,
          confidence: mockConfidence
        }
      }),
      terminate: jest.fn().mockResolvedValue(undefined)
    });

    // Mock PDF service
    ;(PDFService.extractImages as jest.Mock).mockResolvedValue([mockImageData]);
  });

  afterEach(async () => {
    await OCRService.cleanup();
    jest.clearAllMocks();
  });

  it('recognizes text from PDF images', async () => {
    const result = await OCRService.recognizeText(mockFile);
    
    expect(result.text).toBe(mockText);
    expect(result.confidence).toBe(mockConfidence);
    expect(result.error).toBeUndefined();
    expect(PDFService.extractImages).toHaveBeenCalledWith(mockFile);
  });

  it('handles PDF with no images', async () => {
    ;(PDFService.extractImages as jest.Mock).mockResolvedValue([]);

    const result = await OCRService.recognizeText(mockFile);
    
    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
    expect(result.error).toBe('No images found in PDF');
  });

  it('recognizes text from image file', async () => {
    const imageFile = new File(['test'], 'test.png', { type: 'image/png' });
    const result = await OCRService.recognizeText(imageFile);
    
    expect(result.text).toBe(mockText);
    expect(result.confidence).toBe(mockConfidence);
    expect(result.error).toBeUndefined();
    expect(PDFService.extractImages).not.toHaveBeenCalled();
  });

  it('handles OCR errors', async () => {
    const errorMessage = 'OCR processing failed';
    ;(createWorker as jest.Mock).mockResolvedValue({
      loadLanguage: jest.fn().mockRejectedValue(new Error(errorMessage)),
      initialize: jest.fn().mockResolvedValue(undefined),
      recognize: jest.fn().mockResolvedValue({}),
      terminate: jest.fn().mockResolvedValue(undefined)
    });

    const result = await OCRService.recognizeText(mockFile);
    
    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
    expect(result.error).toBe(errorMessage);
  });

  it('combines results from multiple images', async () => {
    const secondText = 'Text from second image';
    const secondConfidence = 85.5;
    ;(PDFService.extractImages as jest.Mock).mockResolvedValue([mockImageData, mockImageData]);
    ;(createWorker as jest.Mock).mockResolvedValue({
      loadLanguage: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
      recognize: jest.fn()
        .mockResolvedValueOnce({
          data: { text: mockText, confidence: mockConfidence }
        })
        .mockResolvedValueOnce({
          data: { text: secondText, confidence: secondConfidence }
        }),
      terminate: jest.fn().mockResolvedValue(undefined)
    });

    const result = await OCRService.recognizeText(mockFile);
    
    expect(result.text).toBe(`${mockText}\n${secondText}`);
    expect(result.confidence).toBe((mockConfidence + secondConfidence) / 2);
    expect(result.error).toBeUndefined();
  });

  it('cleans up worker after use', async () => {
    const worker = {
      loadLanguage: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
      recognize: jest.fn().mockResolvedValue({
        data: { text: mockText, confidence: mockConfidence }
      }),
      terminate: jest.fn().mockResolvedValue(undefined)
    };
    ;(createWorker as jest.Mock).mockResolvedValue(worker);

    await OCRService.recognizeText(mockFile);
    await OCRService.cleanup();
    
    expect(worker.terminate).toHaveBeenCalled();
  });
}); 