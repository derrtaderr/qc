import { NextRequest, NextResponse } from 'next/server';
import { VisualQCAnalyzer } from '@/lib/visual-qc';

/**
 * API endpoint for analyzing PDFs for visual QC issues
 * Detects alignment, spacing, margin, and typography issues
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file || !file.type.includes('pdf')) {
      return NextResponse.json(
        { success: false, error: 'No PDF file uploaded' },
        { status: 400 }
      );
    }
    
    // Get file size
    const fileSize = file.size;
    // Limit file size to 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    
    if (fileSize > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds the 10MB limit' },
        { status: 400 }
      );
    }
    
    console.log(`Processing PDF for visual QC: ${file.name}, size: ${fileSize / 1024 / 1024}MB`);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      // Analyze PDF for visual QC issues
      console.log('Starting visual QC analysis...');
      const analysisResult = await VisualQCAnalyzer.analyzePDF(arrayBuffer);
      
      console.log(`Visual QC analysis completed. Found ${analysisResult.issues.length} issues across ${analysisResult.pageCount} pages.`);
      
      // If no text elements were found, this is likely an image-based PDF
      if (analysisResult.textElements.length === 0) {
        return NextResponse.json({
          success: true,
          issues: [],
          fileType: 'image-based-pdf',
          message: 'This appears to be an image-based PDF without extractable text elements. Consider using OCR for text extraction.',
          pageCount: analysisResult.pageCount,
          summary: {
            totalIssues: 0,
            byType: {
              alignment: 0,
              spacing: 0,
              margin: 0,
              typography: 0
            },
            bySeverity: {
              high: 0,
              medium: 0,
              low: 0
            },
            byPage: {}
          }
        });
      }
      
      // Group issues by type for easier client-side handling
      const issuesByType = {
        alignment: analysisResult.issues.filter(issue => issue.type === 'alignment'),
        spacing: analysisResult.issues.filter(issue => issue.type === 'spacing'),
        margin: analysisResult.issues.filter(issue => issue.type === 'margin'),
        typography: analysisResult.issues.filter(issue => issue.type === 'typography')
      };
      
      // Group issues by severity
      const issuesBySeverity = {
        high: analysisResult.issues.filter(issue => issue.severity === 'high'),
        medium: analysisResult.issues.filter(issue => issue.severity === 'medium'),
        low: analysisResult.issues.filter(issue => issue.severity === 'low')
      };
      
      // Count issues by page
      const issuesByPage: { [pageNum: number]: number } = {};
      analysisResult.issues.forEach(issue => {
        issuesByPage[issue.page] = (issuesByPage[issue.page] || 0) + 1;
      });
      
      return NextResponse.json({
        success: true,
        issues: analysisResult.issues,
        fileType: 'text-based-pdf',
        textElementCount: analysisResult.textElements.length,
        summary: {
          totalIssues: analysisResult.issues.length,
          byType: {
            alignment: issuesByType.alignment.length,
            spacing: issuesByType.spacing.length,
            margin: issuesByType.margin.length,
            typography: issuesByType.typography.length
          },
          bySeverity: {
            high: issuesBySeverity.high.length,
            medium: issuesBySeverity.medium.length,
            low: issuesBySeverity.low.length
          },
          byPage: issuesByPage
        },
        pageCount: analysisResult.pageCount
      });
    } catch (error) {
      console.error('Error analyzing PDF for visual QC:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to analyze PDF for visual QC issues',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process PDF file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 