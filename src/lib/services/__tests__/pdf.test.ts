import { PDFService } from '../pdf';

describe('PDFService', () => {
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