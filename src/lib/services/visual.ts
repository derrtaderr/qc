import cv from '@techstark/opencv-js';

export interface VisualAnalysisResult {
  fonts: {
    name: string;
    size: number;
    count: number;
  }[];
  lineAlignment: {
    misalignments: {
      page: number;
      line: number;
      offset: number;
    }[];
  };
  spacing: {
    inconsistencies: {
      page: number;
      location: { x: number; y: number };
      expected: number;
      actual: number;
    }[];
  };
  anomalies: {
    type: 'corruption' | 'repetition' | 'unknown';
    page: number;
    location: { x: number; y: number };
    description: string;
  }[];
  error?: string;
}

export class VisualAnalysisService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await cv.ready;
    this.isInitialized = true;
  }

  static async analyzePage(imageData: ImageData): Promise<VisualAnalysisResult> {
    try {
      await this.initialize();

      const mat = cv.matFromImageData(imageData);
      const result: VisualAnalysisResult = {
        fonts: [],
        lineAlignment: { misalignments: [] },
        spacing: { inconsistencies: [] },
        anomalies: [],
      };

      // Detect text regions
      const gray = new cv.Mat();
      cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
      
      // Find contours for text blocks
      const binary = new cv.Mat();
      cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
      
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(
        binary,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      // Analyze text regions
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const rect = cv.boundingRect(contour);
        
        // Analyze font characteristics
        const roi = mat.roi(rect);
        this.analyzeFonts(roi, result);
        
        // Check line alignment
        this.checkLineAlignment(roi, rect, result);
        
        // Check spacing
        this.checkSpacing(roi, rect, result);
        
        // Check for anomalies
        this.detectAnomalies(roi, rect, result);
        
        roi.delete();
        contour.delete();
      }

      // Cleanup
      mat.delete();
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();

      return result;
    } catch (error) {
      if (error instanceof Error) {
        return {
          fonts: [],
          lineAlignment: { misalignments: [] },
          spacing: { inconsistencies: [] },
          anomalies: [],
          error: error.message,
        };
      }
      return {
        fonts: [],
        lineAlignment: { misalignments: [] },
        spacing: { inconsistencies: [] },
        anomalies: [],
        error: 'An unknown error occurred during visual analysis',
      };
    }
  }

  private static analyzeFonts(roi: cv.Mat, result: VisualAnalysisResult): void {
    // Font analysis logic using connected components and contour analysis
    // This is a simplified version - real implementation would be more complex
    const stats = new cv.Mat();
    const centroids = new cv.Mat();
    const labels = new cv.Mat();
    const numLabels = cv.connectedComponentsWithStats(
      roi,
      labels,
      stats,
      centroids,
      8,
      cv.CV_32S
    );

    // Analyze connected components for font characteristics
    for (let i = 1; i < numLabels; i++) {
      const area = stats.intAt(i, cv.CC_STAT_AREA);
      const width = stats.intAt(i, cv.CC_STAT_WIDTH);
      const height = stats.intAt(i, cv.CC_STAT_HEIGHT);

      // Simple font size estimation based on component height
      const fontSize = Math.round(height * 0.75); // Approximate point size

      result.fonts.push({
        name: 'Unknown', // Font recognition would require more sophisticated analysis
        size: fontSize,
        count: 1,
      });
    }

    // Cleanup
    stats.delete();
    centroids.delete();
    labels.delete();
  }

  private static checkLineAlignment(
    roi: cv.Mat,
    rect: { x: number; y: number; width: number; height: number },
    result: VisualAnalysisResult
  ): void {
    // Line alignment analysis using horizontal projection
    const projection = new cv.Mat();
    cv.reduce(roi, projection, 0, cv.REDUCE_SUM, cv.CV_32F);

    // Find peaks in projection (line positions)
    const peaks: number[] = [];
    for (let i = 1; i < projection.cols - 1; i++) {
      const prev = projection.floatAt(0, i - 1);
      const curr = projection.floatAt(0, i);
      const next = projection.floatAt(0, i + 1);
      
      if (curr > prev && curr > next && curr > 100) { // Threshold for line detection
        peaks.push(i);
      }
    }

    // Check alignment between consecutive lines
    for (let i = 1; i < peaks.length; i++) {
      const offset = Math.abs(peaks[i] - peaks[i - 1]);
      if (offset > 2) { // Threshold for misalignment
        result.lineAlignment.misalignments.push({
          page: 1, // Assuming single page for now
          line: i,
          offset,
        });
      }
    }

    projection.delete();
  }

  private static checkSpacing(
    roi: cv.Mat,
    rect: { x: number; y: number; width: number; height: number },
    result: VisualAnalysisResult
  ): void {
    // Vertical projection for word spacing analysis
    const projection = new cv.Mat();
    cv.reduce(roi, projection, 1, cv.REDUCE_SUM, cv.CV_32F);

    // Find gaps between words
    let prevGap = 0;
    for (let i = 1; i < projection.rows - 1; i++) {
      const value = projection.floatAt(i, 0);
      if (value < 50) { // Threshold for gap detection
        const gapWidth = i - prevGap;
        prevGap = i;

        // Check for inconsistent spacing
        if (gapWidth > 0 && Math.abs(gapWidth - 20) > 5) { // Expected spacing = 20px
          result.spacing.inconsistencies.push({
            page: 1, // Assuming single page for now
            location: { x: rect.x + i, y: rect.y },
            expected: 20,
            actual: gapWidth,
          });
        }
      }
    }

    projection.delete();
  }

  private static detectAnomalies(
    roi: cv.Mat,
    rect: { x: number; y: number; width: number; height: number },
    result: VisualAnalysisResult
  ): void {
    // Simple anomaly detection based on pattern repetition
    const hist = new cv.Mat();
    const channels = [0];
    const histSize = [256];
    const ranges = [0, 256];
    cv.calcHist(
      [roi],
      channels,
      new cv.Mat(),
      hist,
      histSize,
      ranges
    );

    // Check for unusual patterns in histogram
    let maxVal = 0;
    let maxIdx = 0;
    for (let i = 0; i < hist.rows; i++) {
      const val = hist.floatAt(i, 0);
      if (val > maxVal) {
        maxVal = val;
        maxIdx = i;
      }
    }

    // Detect potential corruption or repetition
    if (maxVal > roi.rows * roi.cols * 0.5) { // More than 50% same value
      result.anomalies.push({
        type: 'repetition',
        page: 1, // Assuming single page for now
        location: { x: rect.x, y: rect.y },
        description: `Unusual pattern repetition detected at (${rect.x}, ${rect.y})`,
      });
    }

    hist.delete();
  }
} 