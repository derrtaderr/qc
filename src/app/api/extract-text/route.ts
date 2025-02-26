import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { PDFTextExtractor } from '@/lib/pdf-ocr';

// Helper function to convert array buffer to Buffer
const arrayBufferToBuffer = (arrayBuffer: ArrayBuffer): Buffer => {
  const buffer = Buffer.alloc(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
};

// Define interface for PDF.js content items
interface PdfPageContent {
  str: string;
  [key: string]: any;
}

// Define interface for PDF.js page
interface PdfPage {
  content: PdfPageContent[];
  [key: string]: any;
}

// Custom render function to better preserve PDF formatting
const customRenderPage = (pageData: any) => {
  return pageData.getTextContent({
    // Include as much information as possible
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  })
  .then((textContent: any) => {
    let lastY = null;
    let lastX = null;
    let text = '';
    
    // Sort items by vertical position (top to bottom)
    const items = textContent.items.sort((a: any, b: any) => {
      // Use the y-coordinate for sorting (vertical position)
      return a.transform[5] - b.transform[5];
    });
    
    // Group text by lines and preserve horizontal positioning
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      
      // New line detection - significant y-position change
      if (lastY !== null && Math.abs(y - lastY) > 5) {
        text += '\n';
        
        // Add an extra line break for paragraphs (larger gaps)
        if (Math.abs(y - lastY) > 15) {
          text += '\n';
        }
      } 
      // Add space for horizontal separation within the same line
      else if (lastX !== null && lastY === y && x - lastX > 10) {
        text += ' ';
      }
      
      // Add the text content
      text += item.str;
      
      lastY = y;
      lastX = x + item.width;
    }
    
    return text;
  });
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file || !file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'No PDF file uploaded' },
        { status: 400 }
      );
    }
    
    // Get file size
    const fileSize = file.size;
    // Limit file size to 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit' },
        { status: 400 }
      );
    }
    
    console.log(`Processing PDF: ${file.name}, size: ${fileSize / 1024 / 1024}MB`);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      // Use our enhanced PDF text extractor with OCR capabilities
      console.log('Starting enhanced PDF text extraction with OCR support...');
      const result = await PDFTextExtractor.extractText(arrayBuffer);
      
      console.log(`Text extracted successfully using ${result.method} method. Length: ${result.text.length} characters, Confidence: ${result.confidence}`);
      
      // If we extracted very little text despite our best efforts
      if (result.text.length < 20) {
        return NextResponse.json({
          success: false,
          error: "Could not extract meaningful text from this PDF. The file may be image-based with poor quality or contain secured content.",
          suggestion: "Try using a PDF with clearer text or adjust the image quality."
        }, { status: 422 });
      }
      
      return NextResponse.json({
        success: true,
        text: result.text,
        info: {
          extractionMethod: result.method,
          confidence: result.confidence,
          charCount: result.text.length,
          pageCount: result.pageCount
        }
      });
    } catch (error) {
      console.error('Error with PDF text extraction:', error);
      
      // Fall back to traditional PDF extraction if enhanced extraction fails
      try {
        // Convert ArrayBuffer to Buffer for pdf-parse
        const buffer = arrayBufferToBuffer(arrayBuffer);
        const data = await pdfParse(buffer);
        const extractedText = data.text || '';
        
        console.log(`Fallback extraction completed. Length: ${extractedText.length} characters`);
        
        if (extractedText.length < 20) {
          return NextResponse.json({
            success: false,
            error: "Could not extract meaningful text from this PDF using fallback method.",
            suggestion: "The PDF may contain only images or be password protected."
          }, { status: 422 });
        }
        
        return NextResponse.json({
          success: true,
          text: extractedText,
          info: {
            extractionMethod: 'pdf-parse-fallback',
            confidence: 0.5,
            charCount: extractedText.length,
            pageCount: data.numpages
          }
        });
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
        return NextResponse.json({
          success: false,
          error: "All PDF extraction methods failed. The file may be corrupted or secured.",
        }, { status: 422 });
      }
    }
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF file' },
      { status: 500 }
    );
  }
} 