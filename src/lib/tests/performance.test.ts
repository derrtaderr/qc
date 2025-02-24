import { performance } from 'perf_hooks';
import { cacheService } from '../services/cache';
import { monitoringService } from '../services/monitoring';
import { readFileSync } from 'fs';
import path from 'path';

describe('Performance Tests', () => {
  const samplePDFPath = path.join(process.cwd(), 'src/lib/tests/fixtures/sample.pdf');
  let samplePDFBuffer: Buffer;

  beforeAll(() => {
    samplePDFBuffer = readFileSync(samplePDFPath);
  });

  afterAll(async () => {
    await cacheService.close();
  });

  describe('PDF Processing Performance', () => {
    it('should process PDF text extraction within acceptable time', async () => {
      const startTime = performance.now();
      
      // Create a worker
      const worker = new Worker(
        new URL('../workers/pdf.worker.ts', import.meta.url)
      );

      // Convert Buffer to ArrayBuffer
      const arrayBuffer = samplePDFBuffer.buffer.slice(
        samplePDFBuffer.byteOffset,
        samplePDFBuffer.byteOffset + samplePDFBuffer.byteLength
      );

      // Process PDF
      await new Promise<void>((resolve, reject) => {
        worker.postMessage({ type: 'extract_text', fileData: arrayBuffer });
        
        worker.onmessage = (e) => {
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve();
          }
        };

        worker.onerror = (error) => {
          reject(error);
        };
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Track performance
      monitoringService.trackWorkerPerformance('text_extraction', {
        duration,
        startTime,
        endTime,
        success: true,
      });

      // Cleanup
      worker.terminate();

      // Assert processing time is under 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should process PDF image extraction within acceptable time', async () => {
      const startTime = performance.now();
      
      // Create a worker
      const worker = new Worker(
        new URL('../workers/pdf.worker.ts', import.meta.url)
      );

      // Convert Buffer to ArrayBuffer
      const arrayBuffer = samplePDFBuffer.buffer.slice(
        samplePDFBuffer.byteOffset,
        samplePDFBuffer.byteOffset + samplePDFBuffer.byteLength
      );

      // Process PDF
      await new Promise<void>((resolve, reject) => {
        worker.postMessage({ type: 'extract_images', fileData: arrayBuffer });
        
        worker.onmessage = (e) => {
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve();
          }
        };

        worker.onerror = (error) => {
          reject(error);
        };
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Track performance
      monitoringService.trackWorkerPerformance('image_extraction', {
        duration,
        startTime,
        endTime,
        success: true,
      });

      // Cleanup
      worker.terminate();

      // Assert processing time is under 3 seconds
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Cache Performance', () => {
    const testData = {
      text: { content: 'Test content', issues: [] },
      visual: {
        fonts: [],
        lineAlignment: { misalignments: [] },
        spacing: { inconsistencies: [] },
        anomalies: [],
      },
    };

    it('should cache and retrieve data within acceptable time', async () => {
      const startTime = performance.now();
      
      // Cache data
      await cacheService.cacheAnalysisResult(
        'test-hash',
        'text',
        testData,
        3600
      );

      // Retrieve data
      const cached = await cacheService.getAnalysisResult('test-hash', 'text');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Track performance
      monitoringService.trackCachePerformance('read_write', true, duration);

      // Assert cache operations complete within 100ms
      expect(duration).toBeLessThan(100);
      expect(cached).toEqual(testData);
    });

    it('should handle cache misses efficiently', async () => {
      const startTime = performance.now();
      
      // Attempt to retrieve non-existent data
      const cached = await cacheService.getAnalysisResult(
        'non-existent',
        'text'
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Track performance
      monitoringService.trackCachePerformance('read_miss', false, duration);

      // Assert cache miss handling completes within 50ms
      expect(duration).toBeLessThan(50);
      expect(cached).toBeNull();
    });
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory usage during PDF processing', async () => {
      const initialMemory = process.memoryUsage();
      
      // Process PDF multiple times
      for (let i = 0; i < 5; i++) {
        const worker = new Worker(
          new URL('../workers/pdf.worker.ts', import.meta.url)
        );

        const arrayBuffer = samplePDFBuffer.buffer.slice(
          samplePDFBuffer.byteOffset,
          samplePDFBuffer.byteOffset + samplePDFBuffer.byteLength
        );

        await new Promise<void>((resolve, reject) => {
          worker.postMessage({ type: 'extract_text', fileData: arrayBuffer });
          
          worker.onmessage = (e) => {
            if (e.data.error) {
              reject(new Error(e.data.error));
            } else {
              resolve();
            }
          };

          worker.onerror = (error) => {
            reject(error);
          };
        });

        worker.terminate();
      }

      const finalMemory = process.memoryUsage();

      // Assert heap used increased by less than 50MB
      const heapIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      expect(heapIncrease).toBeLessThan(50);
    });
  });
}); 