export interface TextIssue {
  type: 'spelling' | 'grammar' | 'style';
  message: string;
  context: string;
  suggestions?: string[];
  position?: {
    start: number;
    end: number;
  };
}

export interface VisualIssue {
  type: string;
  description: string;
  location: {
    page: number;
    coordinates?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export interface TextAnalysisResult {
  content: string;
  issues: TextIssue[];
}

export interface VisualAnalysisResult {
  fonts: Array<{
    name: string;
    size: number;
    pages: number[];
  }>;
  lineAlignment: {
    misalignments: Array<{
      page: number;
      line: number;
      expectedPosition: number;
      actualPosition: number;
    }>;
  };
  spacing: {
    inconsistencies: Array<{
      page: number;
      location: string;
      expectedSpacing: number;
      actualSpacing: number;
    }>;
  };
  anomalies: VisualIssue[];
}

export interface AnalysisResult {
  text: TextAnalysisResult;
  visual: VisualAnalysisResult;
} 