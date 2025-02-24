import { OCRService } from '../ocr';

describe('OCRService', () => {
  beforeAll(async () => {
    await OCRService.initWorkers(1);
  });

  afterAll(async () => {
    await OCRService.terminate();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  describe('recognizeText', () => {
    it('processes text from image data', async () => {
      const imageData = new ImageData(1, 1);
      const result = await OCRService.recognizeText(imageData);
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('confidence');
    });

    it('handles errors gracefully', async () => {
      const invalidImage = 'invalid-image-data';
      const result = await OCRService.recognizeText(invalidImage);
      expect(result.error).toBeTruthy();
    });

    it('uses cache for repeated requests', async () => {
      const imageData = new ImageData(1, 1);
      const firstResult = await OCRService.recognizeText(imageData);
      const secondResult = await OCRService.recognizeText(imageData);
      expect(secondResult).toEqual(firstResult);
    });
  });

  describe('caching', () => {
    it('expires cache after 24 hours', async () => {
      const imageData = new ImageData(1, 1);
      await OCRService.recognizeText(imageData);
      
      // Mock Date.now to return a time 25 hours in the future
      const realDateNow = Date.now;
      Date.now = jest.fn(() => realDateNow() + 25 * 60 * 60 * 1000);
      
      const cachedResult = await OCRService.recognizeText(imageData);
      expect(cachedResult).not.toBeNull();
      
      // Restore Date.now
      Date.now = realDateNow;
    });
  });
}); 