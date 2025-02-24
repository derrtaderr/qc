import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Button variant="outline" className="mb-4">
              Choose File
            </Button>
            <p className="text-sm text-gray-500">
              or drag and drop your PDF here (max 10MB)
            </p>
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
          steps={[]}
          currentStep=""
          overallProgress={0}
          status="idle"
        />
      </Suspense>

      {/* Results Dashboard */}
      <Suspense fallback={
        <Card className="w-full p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading results...</span>
          </div>
        </Card>
      }>
        <ResultsDashboard
          result={{
            text: { content: '', issues: [] },
            visual: {
              fonts: [],
              lineAlignment: { misalignments: [] },
              spacing: { inconsistencies: [] },
              anomalies: [],
            },
          }}
          onExport={() => {}}
        />
      </Suspense>

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
    </main>
  );
} 