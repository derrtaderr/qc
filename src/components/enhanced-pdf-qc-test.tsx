"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, AlertTriangle, Info, Check, X, ImageIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { QCIssue } from "@/lib/visual-qc";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type VisualQCResponse = {
  success: boolean;
  issues: QCIssue[];
  fileType?: 'image-based-pdf' | 'text-based-pdf';
  message?: string;
  textElementCount?: number;
  summary: {
    totalIssues: number;
    byType: {
      alignment: number;
      spacing: number;
      margin: number;
      typography: number;
    };
    bySeverity: {
      high: number;
      medium: number;
      low: number;
    };
    byPage: Record<number, number>;
  };
  pageCount: number;
};

export function EnhancedPDFQCTest() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [qcResults, setQCResults] = useState<VisualQCResponse | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file");
        setFile(null);
        setFileName("");
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError("");
      setQCResults(null);
    }
  };

  const analyzeVisualQC = async () => {
    if (!file) {
      setError("Please upload a PDF file first");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append("file", file);

      // Call the visual-qc API endpoint
      const response = await fetch("/api/visual-qc", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Error analyzing PDF: ${data.error || response.statusText}`);
      }

      if (data.success === false) {
        setError(data.error || "Failed to analyze PDF");
        setQCResults(null);
      } else {
        setQCResults(data);
      }
    } catch (err: any) {
      console.error("Error analyzing PDF:", err);
      setError(err.message || "Failed to analyze PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'alignment':
        return '↔️';
      case 'spacing':
        return '↕️';
      case 'margin':
        return '⇲';
      case 'typography':
        return 'A';
      default:
        return '!';
    }
  };

  const getIssueSummary = (issues: QCIssue[]) => {
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;
    
    return (
      <div className="flex gap-2 mt-2">
        {highCount > 0 && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {highCount} High
          </Badge>
        )}
        {mediumCount > 0 && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {mediumCount} Medium
          </Badge>
        )}
        {lowCount > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {lowCount} Low
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Visual QC Analysis
        </CardTitle>
        <CardDescription>
          Upload a PDF to analyze it for design and formatting issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* File upload section */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="file"
                id="pdf-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept="application/pdf"
              />
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Select PDF
              </Button>
            </div>
            {fileName && (
              <span className="text-sm text-gray-500">
                {fileName}
              </span>
            )}
            <Button
              onClick={analyzeVisualQC}
              disabled={!file || isLoading}
              className="ml-auto"
            >
              {isLoading ? "Analyzing..." : "Analyze Design"}
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* QC Results */}
          {qcResults && (
            <div className="space-y-6">
              {/* Image-based PDF notification */}
              {qcResults.fileType === 'image-based-pdf' && (
                <Alert className="bg-blue-50 border-blue-200">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Image-based PDF detected</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    This PDF appears to be image-based without extractable text elements. Visual formatting analysis is limited.
                    We recommend switching to the Text Extraction tab to use OCR for analyzing the content.
                  </AlertDescription>
                </Alert>
              )}

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Analysis Summary</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Issues</p>
                    <p className="text-2xl font-semibold">{qcResults.summary.totalIssues}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">
                      {qcResults.fileType === 'image-based-pdf' ? 'Total Pages' : 'Affected Pages'}
                    </p>
                    <p className="text-2xl font-semibold">
                      {qcResults.fileType === 'image-based-pdf' 
                        ? qcResults.pageCount 
                        : `${Object.keys(qcResults.summary.byPage).length} of ${qcResults.pageCount}`
                      }
                    </p>
                  </div>
                </div>
                
                {qcResults.fileType === 'text-based-pdf' && qcResults.summary.totalIssues > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Alignment Issues</span>
                        <span className="text-sm font-medium">{qcResults.summary.byType.alignment}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${qcResults.summary.totalIssues > 0 ? qcResults.summary.byType.alignment / qcResults.summary.totalIssues * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Spacing Issues</span>
                        <span className="text-sm font-medium">{qcResults.summary.byType.spacing}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${qcResults.summary.totalIssues > 0 ? qcResults.summary.byType.spacing / qcResults.summary.totalIssues * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Margin Issues</span>
                        <span className="text-sm font-medium">{qcResults.summary.byType.margin}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${qcResults.summary.totalIssues > 0 ? qcResults.summary.byType.margin / qcResults.summary.totalIssues * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Typography Issues</span>
                        <span className="text-sm font-medium">{qcResults.summary.byType.typography}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${qcResults.summary.totalIssues > 0 ? qcResults.summary.byType.typography / qcResults.summary.totalIssues * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {qcResults.fileType === 'text-based-pdf' && (
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Text elements found: {qcResults.textElementCount}</p>
                  </div>
                )}
              </div>
              
              {/* Issues List */}
              <div>
                <h3 className="font-medium mb-3">Detected Issues</h3>
                
                {qcResults.issues.length === 0 ? (
                  <Alert className={qcResults.fileType === 'image-based-pdf' ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"}>
                    {qcResults.fileType === 'image-based-pdf' ? (
                      <Info className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    <AlertTitle className={qcResults.fileType === 'image-based-pdf' ? "text-blue-800" : "text-green-800"}>
                      {qcResults.fileType === 'image-based-pdf' ? "Analysis Limited" : "No Issues Detected"}
                    </AlertTitle>
                    <AlertDescription className={qcResults.fileType === 'image-based-pdf' ? "text-blue-700" : "text-green-700"}>
                      {qcResults.fileType === 'image-based-pdf' 
                        ? qcResults.message || "This is an image-based PDF. Try using OCR in the Text Extraction tab."
                        : "Great job! No design or formatting issues were found in this PDF."
                      }
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Accordion type="single" collapsible className="border rounded-md">
                    {qcResults.issues.map((issue, index) => (
                      <AccordionItem key={index} value={`issue-${index}`}>
                        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3 text-left">
                            <span className="inline-block w-6 h-6 text-center leading-6 rounded-full bg-gray-100">
                              {getIssueTypeIcon(issue.type)}
                            </span>
                            <span className="flex-1">{issue.description}</span>
                            <Badge className={getSeverityColor(issue.severity)}>
                              {issue.severity}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-gray-50">
                          <div className="space-y-2">
                            <p className="text-sm text-gray-700">
                              <strong>Page:</strong> {issue.page}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Type:</strong> {issue.type}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Affected Text:</strong> {issue.elements.map(el => `"${el.text}"`).join(', ')}
                            </p>
                            <div className="text-xs bg-gray-100 p-2 rounded mt-2">
                              <p>Position: x:{Math.round(issue.location?.x || 0)}, y:{Math.round(issue.location?.y || 0)}</p>
                              <p>Size: width:{Math.round(issue.location?.width || 0)}, height:{Math.round(issue.location?.height || 0)}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 