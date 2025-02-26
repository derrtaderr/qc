import * as pdfjs from 'pdfjs-dist';
import { createWorker, Worker, PSM, OEM } from 'tesseract.js';
import { configurePdfjs } from './pdf-config';

// Type for Tesseract logger
interface TesseractLogger {
  status: string;
  progress: number;
  [key: string]: any;
}

/**
 * Enhanced PDF text extraction with OCR capabilities
 */
export class PDFTextExtractor {
  /**
   * Extract text from a PDF buffer using both native extraction and OCR if needed
   */
  static async extractText(pdfBuffer: ArrayBuffer): Promise<{
    text: string;
    method: string;
    confidence: number;
    pageCount: number;
  }> {
    try {
      // First try native text extraction
      const nativeResult = await this.extractNativeText(pdfBuffer);
      
      // If we got a reasonable amount of text, return it
      if (nativeResult.text.length > 100) {
        return {
          text: nativeResult.text,
          method: 'native',
          confidence: 0.9,
          pageCount: nativeResult.pageCount
        };
      }
      
      // If native extraction failed or found very little text, try OCR
      console.log('Native extraction found little text, trying OCR...');
      const ocrResult = await this.extractWithOCR(pdfBuffer);
      
      // Return the result with more text
      if (ocrResult.text.length > nativeResult.text.length) {
        return {
          text: ocrResult.text,
          method: 'ocr',
          confidence: ocrResult.confidence,
          pageCount: ocrResult.pageCount
        };
      }
      
      // If OCR also failed, return the native result
      return {
        text: nativeResult.text,
        method: 'native',
        confidence: 0.5, // Lower confidence since extraction found little text
        pageCount: nativeResult.pageCount
      };
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }
  
  /**
   * Extract text from PDF using native PDF.js text extraction
   */
  private static async extractNativeText(pdfBuffer: ArrayBuffer): Promise<{
    text: string;
    pageCount: number;
  }> {
    // Configure and load the PDF.js library
    const pdfjsLib = configurePdfjs();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    let fullText = '';
    
    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let lastY = null;
        let pageText = '';
        
        // Process text items, preserving line breaks
        for (const item of textContent.items) {
          if ('str' in item) {
            // Check if we need to add a line break based on y-position change
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
              pageText += '\n';
            }
            
            pageText += item.str;
            lastY = item.transform[5];
          }
        }
        
        fullText += pageText + '\n\n';
      } catch (error) {
        console.error(`Error extracting text from page ${pageNum}:`, error);
      }
    }
    
    return {
      text: this.postProcessText(fullText),
      pageCount: numPages
    };
  }
  
  /**
   * Extract text from PDF using OCR by rendering pages to images
   */
  private static async extractWithOCR(pdfBuffer: ArrayBuffer): Promise<{
    text: string;
    confidence: number;
    pageCount: number;
  }> {
    // Only run OCR in browser environment
    if (typeof window === 'undefined') {
      console.log('OCR is only available in browser environment');
      return { text: '', confidence: 0, pageCount: 0 };
    }
    
    // Configure and load the PDF.js library
    const pdfjsLib = configurePdfjs();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    let fullText = '';
    let totalConfidence = 0;
    
    // Create worker options with proper typing
    const createWorkerOptions = {
      logger: (m: TesseractLogger) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${m.progress * 100}%`);
        }
      }
    };
    
    try {
      // Set up Tesseract worker with proper typing
      const worker = await createWorker(createWorkerOptions);
      
      // Set Tesseract parameters for best results with marketing materials
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      // Set parameters with proper typing
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO, // Automatic page segmentation
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.;:!?()[]{}"/\'\\-_+=@#$%^&*<>|~ '
      });
      
      // Process each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
          
          // Create a canvas for rendering
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Failed to get canvas context');
          }
          
          // Render the PDF page to the canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          
          // Get image data from canvas
          const imageData = canvas.toDataURL('image/png');
          
          // Perform OCR on the image
          const { data } = await worker.recognize(imageData);
          
          // Add page text with double newline between pages
          fullText += data.text + '\n\n';
          totalConfidence += data.confidence;
          
        } catch (error) {
          console.error(`Error processing page ${pageNum} for OCR:`, error);
        }
      }
      
      // Clean up Tesseract worker
      await worker.terminate();
      
      // Calculate average confidence across all pages
      const avgConfidence = numPages > 0 ? totalConfidence / numPages : 0;
      
      return {
        text: this.postProcessText(fullText),
        confidence: avgConfidence / 100, // Convert to 0-1 scale
        pageCount: numPages
      };
    } catch (error) {
      console.error('Error with OCR processing:', error);
      return { 
        text: '', 
        confidence: 0, 
        pageCount: numPages 
      };
    }
  }
  
  /**
   * Clean up and improve extracted text
   */
  private static postProcessText(text: string): string {
    return text
      // Fix cases where words are run together
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Ensure consistent line breaks
      .replace(/\r\n/g, '\n')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Fix common OCR errors
      .replace(/[ıl]l/g, 'll') // Fix "ll" often misrecognized
      .replace(/[ıl]I/g, 'll')
      .replace(/[cç]t/g, 'ct') // Fix "ct" often misrecognized
      .replace(/\bI([^a-zA-Z\d])/g, 'l$1') // Fix lone "I" that should be "l"
      .replace(/\bo\b/g, '0') // Fix lone "o" that should be "0"
      .replace(/([a-zA-Z]),([a-zA-Z])/g, '$1, $2') // Add space after comma between words
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
  }
} 