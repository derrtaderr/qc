import { PDFService } from '../pdf';
import * as pdfjs from 'pdfjs-dist';
import pdfParse from 'pdf-parse';

// Mock dependencies
jest.mock('pdfjs-dist');
jest.mock('pdf-parse');

describe('PDFService', () => {
  const mockPDFText = 'Sample PDF text content';
  const mockPDFInfo = {
    Title: 'Test PDF',
    Author: 'Test Author',
    Subject: 'Test Subject',
    Keywords: 'test, pdf'
  };
  const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

  beforeEach(() => {
    // Mock pdf-parse
    ;(pdfParse as jest.Mock).mockResolvedValue({
      text: mockPDFText,
      numpages: 2,
      info: mockPDFInfo
    });

    // Mock pdfjs
    const mockPage = {
      getOperatorList: jest.fn().mockResolvedValue({
        fnArray: [pdfjs.OPS.paintImageXObject],
        argsArray: [['img_1']]
      }),
      objs: {
        get: jest.fn().mockResolvedValue({
          data: new Uint8Array([1, 2, 3])
        })
      }
    };

    const mockPDF = {
      numPages: 2,
      getPage: jest.fn().mockResolvedValue(mockPage)
    };

    ;(pdfjs.getDocument as jest.Mock).mockReturnValue({
      promise: Promise.resolve(mockPDF)
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('extracts text from PDF', async () => {
    const result = await PDFService.extractText(mockFile);
    
    expect(result.text).toBe(mockPDFText);
    expect(result.numPages).toBe(2);
    expect(result.info).toEqual(mockPDFInfo);
    expect(result.error).toBeUndefined();
  });

  it('handles text extraction errors', async () => {
    const errorMessage = 'Failed to parse PDF';
    ;(pdfParse as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const result = await PDFService.extractText(mockFile);
    
    expect(result.text).toBe('');
    expect(result.numPages).toBe(0);
    expect(result.info).toEqual({});
    expect(result.error).toBe(errorMessage);
  });

  it('extracts images from PDF', async () => {
    const images = await PDFService.extractImages(mockFile);
    
    expect(images).toHaveLength(2); // 1 image per page
    expect(images[0]).toBeInstanceOf(Uint8Array);
    expect(images[0]).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('handles image extraction errors', async () => {
    ;(pdfjs.getDocument as jest.Mock).mockReturnValue({
      promise: Promise.reject(new Error('Failed to load PDF'))
    });

    const images = await PDFService.extractImages(mockFile);
    
    expect(images).toHaveLength(0);
  });

  it('gets page count', async () => {
    const pageCount = await PDFService.getPageCount(mockFile);
    
    expect(pageCount).toBe(2);
  });

  it('validates PDF file', async () => {
    const result = await PDFService.validatePDF(mockFile);
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('detects invalid PDF file', async () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const result = await PDFService.validatePDF(invalidFile);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Not a PDF file');
  });

  it('handles PDF validation errors', async () => {
    ;(pdfjs.getDocument as jest.Mock).mockReturnValue({
      promise: Promise.reject(new Error('Invalid PDF structure'))
    });

    const result = await PDFService.validatePDF(mockFile);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid PDF structure');
  });

  describe('validateFileSize', () => {
    it('accepts files under 10MB', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      expect(PDFService.validateFileSize(file)).toBe(true);
    });

    it('rejects files over 10MB', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });
      expect(PDFService.validateFileSize(largeFile)).toBe(false);
    });
  });

  describe('extractText', () => {
    it('handles file size validation', async () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });
      const result = await PDFService.extractText(largeFile);
      expect(result.error).toBe('File size exceeds 10MB limit');
    });

    it('handles invalid PDF files', async () => {
      const invalidFile = new File(['not a pdf'], 'invalid.pdf', {
        type: 'application/pdf',
      });
      const result = await PDFService.extractText(invalidFile);
      expect(result.error).toBeTruthy();
    });
  });
}); 