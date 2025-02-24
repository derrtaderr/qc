import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">PDF QC Analyzer</h1>
      
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
    </main>
  );
} 