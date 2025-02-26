import { PDFExtractionTest } from "@/components/pdf-extraction-test";
import { EnhancedPDFQCTest } from "@/components/enhanced-pdf-qc-test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestPDFPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Enhanced PDF QC Testing</h1>
      <p className="mb-4 text-gray-600">
        This page helps you test our enhanced PDF QC capabilities, which include both text extraction
        for finding spelling errors and visual analysis for detecting design/formatting issues.
      </p>
      
      <Tabs defaultValue="text-extraction" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="text-extraction">Text Extraction</TabsTrigger>
          <TabsTrigger value="visual-qc">Visual QC Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text-extraction" className="mt-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Text Extraction Testing</h2>
            <p className="text-gray-600 mb-4">
              Upload a PDF to extract text and check for potential spelling or grammar issues. This module
              includes enhanced OCR capabilities to handle image-based PDFs created by designers.
            </p>
            <PDFExtractionTest />
          </div>
        </TabsContent>
        
        <TabsContent value="visual-qc" className="mt-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Visual QC Analysis</h2>
            <p className="text-gray-600 mb-4">
              Upload a PDF to analyze it for design and formatting issues such as inconsistent alignment,
              spacing, margins, and typography. This helps ensure visual consistency in your marketing materials.
            </p>
            <EnhancedPDFQCTest />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 