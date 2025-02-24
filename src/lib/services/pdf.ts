import pdfParse from 'pdf-parse';

export interface PDFAnalysisResult {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
  error?: string;
}

export class PDFService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  static validateFileSize(file: File): boolean {
    return file.size <= this.MAX_FILE_SIZE;
  }

  static async extractText(file: File): Promise<PDFAnalysisResult> {
    try {
      if (!this.validateFileSize(file)) {
        throw new Error('File size exceeds 10MB limit');
      }

      const buffer = await file.arrayBuffer();
      const data = await pdfParse(buffer);

      return {
        text: data.text,
        numPages: data.numpages,
        info: {
          title: data.info.Title,
          author: data.info.Author,
          subject: data.info.Subject,
          keywords: data.info.Keywords,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          text: '',
          numPages: 0,
          info: {},
          error: error.message,
        };
      }
      return {
        text: '',
        numPages: 0,
        info: {},
        error: 'An unknown error occurred while processing the PDF',
      };
    }
  }
} 