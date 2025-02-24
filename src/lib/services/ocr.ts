import { createWorker } from 'tesseract.js';
import { PDFService } from './pdf';

export interface OCRResult {
  text: string;
  confidence: number;
  error?: string;
}

export class OCRService {
  private static worker: Tesseract.Worker | null = null;

  private static async initWorker(): Promise<Tesseract.Worker> {
    if (!this.worker) {
      this.worker = await createWorker('eng');
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
    }
    return this.worker;
  }

  static async recognizeText(file: File): Promise<OCRResult> {
    try {
      // For PDFs, we need to extract images first
      if (file.type === 'application/pdf') {
        const images = await PDFService.extractImages(file);
        if (!images.length) {
          return {
            text: '',
            confidence: 0,
            error: 'No images found in PDF'
          };
        }

        // Process each image and combine results
        const results = await Promise.all(
          images.map(async (imageData) => {
            const worker = await this.initWorker();
            const { data } = await worker.recognize(imageData);
            return {
              text: data.text,
              confidence: data.confidence
            };
          })
        );

        // Combine results
        return {
          text: results.map(r => r.text).join('\n'),
          confidence: results.reduce((acc, r) => acc + r.confidence, 0) / results.length
        };
      }

      // For images, process directly
      const worker = await this.initWorker();
      const { data } = await worker.recognize(file);

      return {
        text: data.text,
        confidence: data.confidence
      };
    } catch (error) {
      return {
        text: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
    }
  }

  static async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
} 