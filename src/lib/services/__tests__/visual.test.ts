import { VisualAnalysisService } from '../visual';

describe('VisualAnalysisService', () => {
  beforeAll(async () => {
    await VisualAnalysisService.initialize();
  });

  describe('analyzePage', () => {
    it('analyzes image data for visual issues', async () => {
      const imageData = new ImageData(100, 100);
      const result = await VisualAnalysisService.analyzePage(imageData);
      
      expect(result).toHaveProperty('fonts');
      expect(result).toHaveProperty('lineAlignment');
      expect(result).toHaveProperty('spacing');
      expect(result).toHaveProperty('anomalies');
    });

    it('handles errors gracefully', async () => {
      // Create an invalid ImageData
      const invalidImageData = new ImageData(0, 0);
      const result = await VisualAnalysisService.analyzePage(invalidImageData);
      
      expect(result.error).toBeTruthy();
      expect(result.fonts).toHaveLength(0);
      expect(result.lineAlignment.misalignments).toHaveLength(0);
      expect(result.spacing.inconsistencies).toHaveLength(0);
      expect(result.anomalies).toHaveLength(0);
    });
  });

  describe('font analysis', () => {
    it('detects font sizes', async () => {
      const imageData = new ImageData(100, 100);
      const result = await VisualAnalysisService.analyzePage(imageData);
      
      expect(Array.isArray(result.fonts)).toBe(true);
      result.fonts.forEach(font => {
        expect(font).toHaveProperty('name');
        expect(font).toHaveProperty('size');
        expect(font).toHaveProperty('count');
        expect(typeof font.size).toBe('number');
        expect(font.size).toBeGreaterThan(0);
      });
    });
  });

  describe('line alignment', () => {
    it('detects misaligned lines', async () => {
      const imageData = new ImageData(100, 100);
      const result = await VisualAnalysisService.analyzePage(imageData);
      
      expect(Array.isArray(result.lineAlignment.misalignments)).toBe(true);
      result.lineAlignment.misalignments.forEach(misalignment => {
        expect(misalignment).toHaveProperty('page');
        expect(misalignment).toHaveProperty('line');
        expect(misalignment).toHaveProperty('offset');
        expect(typeof misalignment.offset).toBe('number');
      });
    });
  });

  describe('spacing analysis', () => {
    it('detects spacing inconsistencies', async () => {
      const imageData = new ImageData(100, 100);
      const result = await VisualAnalysisService.analyzePage(imageData);
      
      expect(Array.isArray(result.spacing.inconsistencies)).toBe(true);
      result.spacing.inconsistencies.forEach(inconsistency => {
        expect(inconsistency).toHaveProperty('page');
        expect(inconsistency).toHaveProperty('location');
        expect(inconsistency).toHaveProperty('expected');
        expect(inconsistency).toHaveProperty('actual');
        expect(typeof inconsistency.expected).toBe('number');
        expect(typeof inconsistency.actual).toBe('number');
      });
    });
  });

  describe('anomaly detection', () => {
    it('detects pattern repetition', async () => {
      const imageData = new ImageData(100, 100);
      const result = await VisualAnalysisService.analyzePage(imageData);
      
      expect(Array.isArray(result.anomalies)).toBe(true);
      result.anomalies.forEach(anomaly => {
        expect(anomaly).toHaveProperty('type');
        expect(anomaly).toHaveProperty('page');
        expect(anomaly).toHaveProperty('location');
        expect(anomaly).toHaveProperty('description');
        expect(typeof anomaly.type).toBe('string');
      });
    });
  });
}); 