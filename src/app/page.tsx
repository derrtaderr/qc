"use client"

import dynamic from 'next/dynamic';
import { Suspense, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from 'lucide-react';
import { AnalysisService } from '@/lib/services/analysis';
import { useAnalysisStore } from '@/lib/stores/analysis';

// Lazy load heavy components
const ResultsDashboard = dynamic(() => import('@/components/results/dashboard').then(mod => mod.ResultsDashboard), {
  loading: () => (
    <Card className="w-full p-6">
      <div className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading results...</span>
      </div>
    </Card>
  ),
  ssr: false // Disable SSR for components that need browser APIs
});

const AnalysisProgressInterface = dynamic(
  () => import('@/components/analysis/progress-interface').then(mod => mod.AnalysisProgressInterface),
  {
    loading: () => (
      <Card className="w-full p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading analysis interface...</span>
        </div>
      </Card>
    )
  }
);

const SettingsInterface = dynamic(
  () => import('@/components/settings/interface').then(mod => mod.SettingsInterface),
  {
    loading: () => (
      <Card className="w-full p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </Card>
    )
  }
);

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { steps, currentStep, overallProgress, status, error, reset } = useAnalysisStore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('File size exceeds 10MB limit');
      return;
    }
    
    setSelectedFile(file);
    reset(); // Reset previous analysis state
    
    try {
      const result = await AnalysisService.analyzePDF(file);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleExport = (format: 'pdf' | 'csv') => {
    console.log(`Exporting as ${format}`);
    // Implement export functionality here
  };

  const handleCancel = async () => {
    await AnalysisService.cancelAnalysis();
  };

  return (
    <main className="container mx-auto p-4 space-y-6">
      <h1 className="text-4xl font-bold text-center mb-8">PDF QC Analyzer</h1>
      
      {/* Upload Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
          <CardDescription>
            Upload your PDF document for quality control analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className={`border-2 border-dashed ${isDragging ? 'custom-border-primary custom-bg-primary-light' : 'custom-border-gray-300'} rounded-lg p-8 text-center transition-colors`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            <Button 
              variant="outline" 
              className="mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            {selectedFile ? (
              <p className="text-sm custom-text-green-600 font-medium">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            ) : (
              <p className="text-sm custom-text-gray-500">
                or drag and drop your PDF here (max 10MB)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      <Suspense fallback={
        <Card className="w-full p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading analysis interface...</span>
          </div>
        </Card>
      }>
        <AnalysisProgressInterface
          steps={steps}
          currentStep={currentStep}
          overallProgress={overallProgress}
          status={status}
          error={error}
          onCancel={handleCancel}
        />
      </Suspense>

      {/* Results Dashboard */}
      {analysisResult && (
        <Suspense fallback={
          <Card className="w-full p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading results...</span>
            </div>
          </Card>
        }>
          <ResultsDashboard
            result={analysisResult}
            onExport={handleExport}
          />
        </Suspense>
      )}

      {/* Settings */}
      <Suspense fallback={
        <Card className="w-full p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        </Card>
      }>
        <SettingsInterface />
      </Suspense>

      <div className="mb-4">
        <a 
          href="/test-pdf" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Test PDF Text Extraction
        </a>
      </div>
    </main>
  );
} 