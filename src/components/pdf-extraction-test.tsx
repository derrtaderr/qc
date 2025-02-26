"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, AlertTriangle, Info, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// This is a test component to verify PDF text extraction
// It allows uploading a PDF and viewing the raw extracted text before analysis

export function PDFExtractionTest() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [suggestion, setSuggestion] = useState<string>("");
  const [extractionInfo, setExtractionInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("raw");

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
      setSuggestion("");
      setExtractedText("");
      setExtractionInfo(null);
    }
  };

  const extractText = async () => {
    if (!file) {
      setError("Please upload a PDF file first");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuggestion("");
    
    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append("file", file);

      // Call the extract-text API endpoint
      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Error extracting text: ${data.error || response.statusText}`);
      }

      if (data.success === false) {
        setError(data.error || "Failed to extract text from PDF");
        if (data.suggestion) {
          setSuggestion(data.suggestion);
        }
        setExtractedText("");
        setExtractionInfo(null);
      } else {
        setExtractedText(data.text || "No text was extracted from the PDF");
        setExtractionInfo(data.info || null);
        
        // If text is empty or very short, show a helpful message
        if (!data.text || data.text.length < 20) {
          setSuggestion("The extracted text is very short. This PDF might be image-based or contain secured content that prevents text extraction.");
        }
      }
    } catch (err: any) {
      console.error("Error extracting text:", err);
      setError(err.message || "Failed to extract text from PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeExtractedText = async () => {
    if (!extractedText) {
      setError("No text to analyze. Please extract text first.");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      // Call the analyze-text API endpoint with the extracted text
      const response = await fetch("/api/analyze-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        throw new Error(`Error analyzing text: ${response.statusText}`);
      }

      // Redirect to results page or handle as needed
      window.location.href = "/results";
    } catch (err: any) {
      console.error("Error analyzing text:", err);
      setError(err.message || "Failed to analyze text");
    } finally {
      setIsLoading(false);
    }
  };

  // Assess formatting quality based on extraction method and text patterns
  const getFormattingQuality = () => {
    if (!extractedText || !extractionInfo) return null;
    
    // Check if the extracted text has proper paragraphs and spacing
    const hasProperParagraphs = extractedText.includes('\n\n');
    const hasProperSpacing = !extractedText.match(/[a-z][A-Z]/g); // No lowercase followed immediately by uppercase
    const hasLineBreaks = (extractedText.match(/\n/g) || []).length > 5;
    
    // Check extraction method
    const isFormattedMethod = extractionInfo.extractionMethod === 'pdf-parse-formatted';
    
    if (isFormattedMethod && hasProperParagraphs && hasProperSpacing) {
      return { 
        quality: 'high',
        message: 'The text formatting was well preserved from the PDF.'
      };
    } else if (hasLineBreaks && (hasProperParagraphs || hasProperSpacing)) {
      return {
        quality: 'medium',
        message: 'The text formatting was partially preserved. Some manual formatting may be needed.'
      };
    } else {
      return {
        quality: 'low',
        message: 'The text formatting was not well preserved. Consider manual formatting corrections.'
      };
    }
  };

  const formattingQuality = getFormattingQuality();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Text Extraction Test
        </CardTitle>
        <CardDescription>
          Upload a PDF to view the raw extracted text before analysis
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
              onClick={extractText}
              disabled={!file || isLoading}
              className="ml-auto"
            >
              Extract Text
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Suggestion message */}
          {suggestion && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>PDF Extraction Info</AlertTitle>
              <AlertDescription>{suggestion}</AlertDescription>
            </Alert>
          )}

          {/* Extraction information */}
          {extractionInfo && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
              <p><strong>Extraction Method:</strong> {extractionInfo.extractionMethod}</p>
              <p><strong>Characters Extracted:</strong> {extractionInfo.charCount}</p>
              {extractionInfo.pageCount && <p><strong>Pages:</strong> {extractionInfo.pageCount}</p>}
              
              {/* Formatting quality indicator */}
              {formattingQuality && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="flex items-center gap-2">
                    <strong>Formatting Quality:</strong> 
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      formattingQuality.quality === 'high' 
                        ? 'bg-green-100 text-green-700' 
                        : formattingQuality.quality === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {formattingQuality.quality === 'high' 
                        ? 'High' 
                        : formattingQuality.quality === 'medium'
                          ? 'Medium'
                          : 'Low'
                      }
                    </span>
                  </div>
                  <p className="mt-1 text-xs">{formattingQuality.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Extracted text display */}
          {extractedText && (
            <div className="space-y-4">
              <Tabs 
                defaultValue="raw" 
                className="w-full"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList>
                  <TabsTrigger value="raw">Raw Text</TabsTrigger>
                  <TabsTrigger value="formatted">Formatted View</TabsTrigger>
                </TabsList>
                <TabsContent value="raw" className="mt-2">
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-[400px] overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm">{extractedText || "No text was extracted"}</pre>
                  </div>
                </TabsContent>
                <TabsContent value="formatted" className="mt-2">
                  <div className="bg-white p-4 rounded-md border border-gray-200 max-h-[400px] overflow-auto">
                    <div className="prose prose-sm max-w-none">
                      {extractedText.split('\n\n').map((paragraph, i) => (
                        <p key={i}>
                          {paragraph.split('\n').map((line, j) => (
                            <React.Fragment key={j}>
                              {line}
                              {j < paragraph.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </p>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button 
                  onClick={analyzeExtractedText} 
                  disabled={isLoading || !extractedText || extractedText.length < 20}
                >
                  Analyze This Text
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 