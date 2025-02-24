import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { TextIssues } from "./text-issues"
import { FormattingIssues } from "./formatting-issues"

export interface AnalysisResult {
  text: {
    content: string;
    issues: {
      type: 'spelling' | 'grammar' | 'style';
      description: string;
      suggestion?: string;
      location: { start: number; end: number };
    }[];
  };
  formatting: {
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
  };
}

export interface ResultsDashboardProps {
  result: AnalysisResult;
  onExport: (format: 'pdf' | 'csv') => void;
}

export function ResultsDashboard({ result, onExport }: ResultsDashboardProps) {
  return (
    <Card className="w-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Analysis Results</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('csv')}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('pdf')}
          >
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="w-full border-b rounded-none p-0">
          <TabsTrigger
            value="text"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Text Issues
            {result.text.issues.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                {result.text.issues.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="formatting"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Formatting Issues
            {(
              result.formatting.lineAlignment.misalignments.length +
              result.formatting.spacing.inconsistencies.length +
              result.formatting.anomalies.length
            ) > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                {
                  result.formatting.lineAlignment.misalignments.length +
                  result.formatting.spacing.inconsistencies.length +
                  result.formatting.anomalies.length
                }
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="p-4">
          <TextIssues issues={result.text.issues} content={result.text.content} />
        </TabsContent>

        <TabsContent value="formatting" className="p-4">
          <FormattingIssues formatting={result.formatting} />
        </TabsContent>
      </Tabs>
    </Card>
  )
} 