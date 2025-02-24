import { PDFService } from './pdf'
import { OCRService } from './ocr'
import LanguageTool from 'languagetool-api'

export interface TextIssue {
  type: 'spelling' | 'grammar' | 'style';
  description: string;
  suggestion?: string;
  location: { start: number; end: number };
}

export interface TextAnalysisResult {
  content: string;
  issues: TextIssue[];
  error?: string;
}

export class TextAnalysisService {
  private static readonly languageTool = new LanguageTool({
    endpoint: process.env.NEXT_PUBLIC_LANGUAGETOOL_API_URL || 'https://api.languagetool.org/v2/check',
  });

  private static readonly STYLE_RULES = {
    'IC50': /IC\s*50|ic\s*50|Ic\s*50/g,
    // Add more style rules as needed
  };

  static async analyzeText(file: File): Promise<TextAnalysisResult> {
    try {
      // Extract text from PDF using both pdf-parse and Tesseract.js
      const [pdfResult, ocrResult] = await Promise.all([
        PDFService.extractText(file),
        this.extractTextFromImages(file),
      ]);

      if (pdfResult.error) {
        throw new Error(pdfResult.error);
      }

      // Combine text from both sources
      const combinedText = this.combineText(pdfResult.text, ocrResult.text);

      // Check for issues using LanguageTool
      const languageToolResult = await this.languageTool.check({
        text: combinedText,
        language: 'en-US',
      });

      // Convert LanguageTool matches to our format
      const issues: TextIssue[] = languageToolResult.matches.map(match => ({
        type: this.mapRuleType(match.rule.category.id),
        description: match.message,
        suggestion: match.replacements[0]?.value,
        location: {
          start: match.offset,
          end: match.offset + match.length,
        },
      }));

      // Add style issues
      const styleIssues = this.checkStyleRules(combinedText);
      issues.push(...styleIssues);

      return {
        content: combinedText,
        issues: issues.sort((a, b) => a.location.start - b.location.start),
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          content: '',
          issues: [],
          error: error.message,
        };
      }
      return {
        content: '',
        issues: [],
        error: 'An unknown error occurred during text analysis',
      };
    }
  }

  private static async extractTextFromImages(file: File): Promise<{ text: string }> {
    try {
      // Convert PDF pages to images and process with OCR
      // This is a simplified version - we'll need to handle multiple pages
      const imageData = await this.convertPDFPageToImage(file, 1);
      const result = await OCRService.recognizeText(imageData);

      return { text: result.text };
    } catch {
      // If OCR fails, return empty text - we still have pdf-parse result
      return { text: '' };
    }
  }

  private static async convertPDFPageToImage(file: File, pageNum: number): Promise<ImageData> {
    // TODO: Implement PDF page to image conversion using pdf.js
    // This is a placeholder that needs to be implemented
    return new ImageData(1, 1);
  }

  private static combineText(pdfText: string, ocrText: string): string {
    // Simple combination for now - we might need more sophisticated merging
    return `${pdfText}\n${ocrText}`.trim();
  }

  private static mapRuleType(category: string): 'spelling' | 'grammar' | 'style' {
    switch (category) {
      case 'TYPOS':
      case 'SPELLING':
        return 'spelling';
      case 'GRAMMAR':
      case 'PUNCTUATION':
        return 'grammar';
      default:
        return 'style';
    }
  }

  private static checkStyleRules(text: string): TextIssue[] {
    const issues: TextIssue[] = [];

    // Check each style rule
    Object.entries(this.STYLE_RULES).forEach(([rule, pattern]) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (rule === 'IC50' && match[0] !== 'IC50') {
          issues.push({
            type: 'style',
            description: `Incorrect formatting of "IC50". Use "IC50" instead of "${match[0]}"`,
            suggestion: 'IC50',
            location: {
              start: match.index,
              end: match.index + match[0].length,
            },
          });
        }
      }
    });

    return issues;
  }
} 