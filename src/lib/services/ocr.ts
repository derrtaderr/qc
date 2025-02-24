import { createWorker } from 'tesseract.js';
import { createScheduler } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  error?: string;
}

export class OCRService {
  private static scheduler = createScheduler();
  private static readonly CACHE_KEY = 'ocr-cache-';
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  static async initWorkers(numWorkers = 2) {
    for (let i = 0; i < numWorkers; i++) {
      const worker = createWorker();
      await worker;
      this.scheduler.addWorker(await worker);
    }
  }

  static async recognizeText(image: ImageData | string): Promise<OCRResult> {
    try {
      // Check cache first
      const cacheKey = this.CACHE_KEY + this.hashImage(image);
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;

      // Process image if not cached
      const result = await this.scheduler.addJob('recognize', image);
      const { data: { text, confidence } } = result;

      // Cache the result
      await this.setInCache(cacheKey, { text, confidence });

      return { text, confidence };
    } catch (error) {
      if (error instanceof Error) {
        return { text: '', confidence: 0, error: error.message };
      }
      return { text: '', confidence: 0, error: 'An unknown error occurred during OCR' };
    }
  }

  static async terminate() {
    await this.scheduler.terminate();
  }

  private static hashImage(image: ImageData | string): string {
    // Simple hash function for cache key
    if (typeof image === 'string') {
      return btoa(image).slice(0, 32);
    }
    return btoa(image.data.toString()).slice(0, 32);
  }

  private static async getFromCache(key: string): Promise<OCRResult | null> {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { value, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.CACHE_EXPIRY) {
        localStorage.removeItem(key);
        return null;
      }

      return value;
    } catch {
      return null;
    }
  }

  private static async setInCache(key: string, value: Omit<OCRResult, 'error'>) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          value,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Ignore cache errors
    }
  }
} 