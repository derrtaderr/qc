import * as pdfjs from 'pdfjs-dist';
import { configurePdfjs } from './pdf-config';

// Define interfaces for text elements and issues
export interface TextElement {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  page: number;
}

export interface QCIssue {
  type: 'alignment' | 'spacing' | 'margin' | 'sizing' | 'typography';
  description: string;
  severity: 'low' | 'medium' | 'high';
  elements: TextElement[];
  page: number;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Constants for QC checks
const ALIGNMENT_THRESHOLD = 3; // Pixels difference to flag as misaligned
const SPACING_THRESHOLD = 5; // Pixels difference to flag as inconsistent spacing
const MARGIN_THRESHOLD = 20; // Pixels from edge to flag as margin issue
const FONT_SIZE_THRESHOLD = 2; // Points difference to flag as inconsistent sizing

/**
 * Visual QC analyzer for detecting design and formatting issues in PDFs
 */
export class VisualQCAnalyzer {
  /**
   * Analyze a PDF for visual QC issues
   */
  static async analyzePDF(pdfBuffer: ArrayBuffer): Promise<{
    issues: QCIssue[];
    textElements: TextElement[];
    pageCount: number;
  }> {
    try {
      // Initialize PDF.js with our configuration
      const pdfjsLib = configurePdfjs();
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;
      
      const textElements: TextElement[] = [];
      const issues: QCIssue[] = [];
      
      // Extract text elements with their visual properties from all pages
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Extract text elements with positions
        const pageTextElements = this.extractTextElements(textContent, pageNum, viewport);
        textElements.push(...pageTextElements);
        
        // Check for alignment issues on this page
        const alignmentIssues = this.checkAlignment(pageTextElements, viewport, pageNum);
        issues.push(...alignmentIssues);
        
        // Check for spacing issues on this page
        const spacingIssues = this.checkSpacing(pageTextElements, pageNum);
        issues.push(...spacingIssues);
        
        // Check for margin issues on this page
        const marginIssues = this.checkMargins(pageTextElements, viewport, pageNum);
        issues.push(...marginIssues);
        
        // Check for font size consistency
        const fontSizeIssues = this.checkFontSizes(pageTextElements, pageNum);
        issues.push(...fontSizeIssues);
      }
      
      return {
        issues,
        textElements,
        pageCount: numPages
      };
    } catch (error) {
      console.error("Error analyzing PDF:", error);
      throw new Error("Failed to analyze PDF for visual QC issues");
    }
  }
  
  /**
   * Extract text elements with their visual properties
   */
  private static extractTextElements(
    textContent: any,
    pageNum: number,
    viewport: any
  ): TextElement[] {
    const elements: TextElement[] = [];
    
    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      
      // Convert PDF coordinates to viewport coordinates
      const [x, y, width, height] = viewport.convertToViewportRectangle([
        item.transform[4],
        item.transform[5],
        item.transform[4] + item.width,
        item.transform[5] + item.height || 20 // Estimated height if not provided
      ]);
      
      // Estimate font size from transform matrix (scale factors)
      const fontSize = Math.abs(item.transform[3]) * viewport.scale;
      
      elements.push({
        text: item.str,
        x,
        y: viewport.height - y, // Flip y-coordinate (PDF coordinates start from bottom)
        width: Math.abs(width - x),
        height: Math.abs(height - y),
        fontSize,
        fontFamily: item.fontName,
        page: pageNum
      });
    }
    
    return elements;
  }
  
  /**
   * Check for horizontal and vertical alignment issues
   */
  private static checkAlignment(
    elements: TextElement[],
    viewport: any,
    pageNum: number
  ): QCIssue[] {
    const issues: QCIssue[] = [];
    
    // Group elements that should be aligned horizontally (similar y positions)
    const horizontalGroups: { [key: string]: TextElement[] } = {};
    
    // Group elements that should be aligned vertically (similar x positions)
    const verticalGroups: { [key: string]: TextElement[] } = {};
    
    // Group by approximate y-position for horizontal alignment
    elements.forEach(el => {
      const yKey = Math.round(el.y / 5) * 5; // Group by 5px bands
      if (!horizontalGroups[yKey]) horizontalGroups[yKey] = [];
      horizontalGroups[yKey].push(el);
    });
    
    // Group by approximate x-position for vertical alignment
    elements.forEach(el => {
      const xKey = Math.round(el.x / 5) * 5; // Group by 5px bands
      if (!verticalGroups[xKey]) verticalGroups[xKey] = [];
      verticalGroups[xKey].push(el);
    });
    
    // Check horizontal alignment (items that should be on the same line)
    Object.values(horizontalGroups).forEach(group => {
      if (group.length > 1) {
        // Find elements that should be aligned but aren't
        const yValues = group.map(el => el.y);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        
        if (maxY - minY > ALIGNMENT_THRESHOLD) {
          // Create a horizontal alignment issue
          issues.push({
            type: 'alignment',
            description: `Inconsistent horizontal alignment of text (${Math.round(maxY - minY)}px difference)`,
            severity: maxY - minY > ALIGNMENT_THRESHOLD * 2 ? 'high' : 'medium',
            elements: group,
            page: pageNum,
            location: {
              x: Math.min(...group.map(el => el.x)),
              y: Math.min(...group.map(el => el.y)),
              width: Math.max(...group.map(el => el.x + el.width)) - Math.min(...group.map(el => el.x)),
              height: Math.max(...group.map(el => el.y + el.height)) - Math.min(...group.map(el => el.y))
            }
          });
        }
      }
    });
    
    // Check vertical alignment (items that should form columns)
    Object.values(verticalGroups).forEach(group => {
      if (group.length > 1) {
        // Find elements that should be aligned but aren't
        const xValues = group.map(el => el.x);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        
        if (maxX - minX > ALIGNMENT_THRESHOLD) {
          // Create a vertical alignment issue
          issues.push({
            type: 'alignment',
            description: `Inconsistent vertical alignment of text (${Math.round(maxX - minX)}px difference)`,
            severity: maxX - minX > ALIGNMENT_THRESHOLD * 2 ? 'high' : 'medium',
            elements: group,
            page: pageNum,
            location: {
              x: Math.min(...group.map(el => el.x)),
              y: Math.min(...group.map(el => el.y)),
              width: Math.max(...group.map(el => el.x + el.width)) - Math.min(...group.map(el => el.x)),
              height: Math.max(...group.map(el => el.y + el.height)) - Math.min(...group.map(el => el.y))
            }
          });
        }
      }
    });
    
    return issues;
  }
  
  /**
   * Check for inconsistent spacing between elements
   */
  private static checkSpacing(elements: TextElement[], pageNum: number): QCIssue[] {
    const issues: QCIssue[] = [];
    
    // Sort elements by y-position (top to bottom)
    const sortedByY = [...elements].sort((a, b) => a.y - b.y);
    
    // Check vertical spacing between elements
    const spacings: number[] = [];
    for (let i = 1; i < sortedByY.length; i++) {
      const current = sortedByY[i];
      const previous = sortedByY[i - 1];
      
      // Skip if elements are far apart horizontally (likely unrelated)
      if (Math.abs(current.x - previous.x) > 100) continue;
      
      // Calculate spacing between elements
      const spacing = current.y - (previous.y + previous.height);
      
      // Only consider reasonable spacing values (avoid huge gaps)
      if (spacing > 0 && spacing < 50) {
        spacings.push(spacing);
      }
    }
    
    // Find common spacing values
    if (spacings.length > 3) {
      // Simple algorithm to find common spacings
      const spacingGroups: { [key: number]: number } = {};
      
      // Group similar spacings
      spacings.forEach(spacing => {
        const roundedSpacing = Math.round(spacing);
        spacingGroups[roundedSpacing] = (spacingGroups[roundedSpacing] || 0) + 1;
      });
      
      // Find most common spacing value
      let mostCommonSpacing = 0;
      let maxCount = 0;
      
      Object.entries(spacingGroups).forEach(([spacing, count]) => {
        if (count > maxCount) {
          mostCommonSpacing = parseInt(spacing);
          maxCount = count;
        }
      });
      
      // Check for inconsistent spacing
      for (let i = 1; i < sortedByY.length; i++) {
        const current = sortedByY[i];
        const previous = sortedByY[i - 1];
        
        // Skip if elements are far apart horizontally
        if (Math.abs(current.x - previous.x) > 100) continue;
        
        const spacing = current.y - (previous.y + previous.height);
        
        // Only flag spacing that differs significantly from the most common
        if (spacing > 0 && spacing < 50 && 
            Math.abs(spacing - mostCommonSpacing) > SPACING_THRESHOLD) {
          
          issues.push({
            type: 'spacing',
            description: `Inconsistent spacing between text elements (${Math.round(spacing)}px vs expected ${mostCommonSpacing}px)`,
            severity: Math.abs(spacing - mostCommonSpacing) > SPACING_THRESHOLD * 2 ? 'high' : 'medium',
            elements: [previous, current],
            page: pageNum,
            location: {
              x: Math.min(previous.x, current.x),
              y: previous.y + previous.height,
              width: Math.max(previous.width, current.width),
              height: spacing
            }
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Check for margin consistency issues
   */
  private static checkMargins(
    elements: TextElement[],
    viewport: any,
    pageNum: number
  ): QCIssue[] {
    const issues: QCIssue[] = [];
    
    // Get page dimensions
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;
    
    // Find elements near the edges of the page
    elements.forEach(el => {
      // Check left margin
      if (el.x < MARGIN_THRESHOLD) {
        // Check if other elements have similar left margins
        const similarElements = elements.filter(other => 
          other !== el && Math.abs(other.x - el.x) <= MARGIN_THRESHOLD / 2);
        
        // If this element's margin is unique, flag it
        if (similarElements.length === 0) {
          issues.push({
            type: 'margin',
            description: `Inconsistent left margin (${Math.round(el.x)}px from edge)`,
            severity: el.x < MARGIN_THRESHOLD / 2 ? 'high' : 'medium',
            elements: [el],
            page: pageNum,
            location: {
              x: 0,
              y: el.y,
              width: el.x + el.width,
              height: el.height
            }
          });
        }
      }
      
      // Check right margin
      const rightMargin = pageWidth - (el.x + el.width);
      if (rightMargin < MARGIN_THRESHOLD) {
        // Check if other elements have similar right margins
        const similarElements = elements.filter(other => {
          const otherRightMargin = pageWidth - (other.x + other.width);
          return other !== el && Math.abs(otherRightMargin - rightMargin) <= MARGIN_THRESHOLD / 2;
        });
        
        // If this element's margin is unique, flag it
        if (similarElements.length === 0) {
          issues.push({
            type: 'margin',
            description: `Inconsistent right margin (${Math.round(rightMargin)}px from edge)`,
            severity: rightMargin < MARGIN_THRESHOLD / 2 ? 'high' : 'medium',
            elements: [el],
            page: pageNum,
            location: {
              x: el.x,
              y: el.y,
              width: pageWidth - el.x,
              height: el.height
            }
          });
        }
      }
    });
    
    return issues;
  }
  
  /**
   * Check for font size consistency issues
   */
  private static checkFontSizes(elements: TextElement[], pageNum: number): QCIssue[] {
    const issues: QCIssue[] = [];
    
    // Group elements by their text length (to compare similar types of text)
    const shortElements = elements.filter(el => el.text.length < 10);
    const mediumElements = elements.filter(el => el.text.length >= 10 && el.text.length < 50);
    const longElements = elements.filter(el => el.text.length >= 50);
    
    // Check font size consistency within each group
    [shortElements, mediumElements, longElements].forEach(group => {
      if (group.length < 2) return;
      
      // Get font sizes and find the most common
      const fontSizes = group.map(el => Math.round(el.fontSize));
      
      // Count occurrences of each font size
      const fontSizeCounts: { [size: number]: number } = {};
      fontSizes.forEach(size => {
        fontSizeCounts[size] = (fontSizeCounts[size] || 0) + 1;
      });
      
      // Find the most common font size
      let mostCommonSize = 0;
      let maxCount = 0;
      
      Object.entries(fontSizeCounts).forEach(([size, count]) => {
        if (count > maxCount) {
          mostCommonSize = parseInt(size);
          maxCount = count;
        }
      });
      
      // Flag elements with inconsistent font sizes
      group.forEach(el => {
        const size = Math.round(el.fontSize);
        
        if (Math.abs(size - mostCommonSize) > FONT_SIZE_THRESHOLD && 
            Math.abs(size - mostCommonSize) / mostCommonSize > 0.1) { // More than 10% difference
          
          issues.push({
            type: 'typography',
            description: `Inconsistent font size (${size}pt vs common ${mostCommonSize}pt)`,
            severity: Math.abs(size - mostCommonSize) > FONT_SIZE_THRESHOLD * 2 ? 'high' : 'medium',
            elements: [el],
            page: pageNum,
            location: {
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height
            }
          });
        }
      });
    });
    
    return issues;
  }
} 