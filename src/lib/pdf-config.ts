import * as pdfjs from 'pdfjs-dist';

/**
 * Configure PDF.js for use in both client and server environments
 */
export function configurePdfjs() {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  if (isBrowser) {
    // For client-side, use CDN worker
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = 
        `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }
  } else {
    // For server-side, we don't set the worker
    // We'll use a more limited approach for server-side PDF processing
    console.log('PDF.js running in server environment - worker not initialized');
  }
  
  return pdfjs;
}

/**
 * Simple check to determine if a PDF is likely to be image-based (no extractable text)
 * This is a server-safe operation that doesn't require PDF.js worker
 */
export async function isImageBasedPDF(pdfBuffer: ArrayBuffer): Promise<boolean> {
  try {
    // Configure PDF.js (but don't rely on worker on server)
    const pdfjsLib = configurePdfjs();
    
    // Load document with limited features (text extraction only)
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      disableRange: true,
      disableStream: true,
      disableAutoFetch: true,
      useWorkerFetch: false,
    });
    
    const pdfDocument = await loadingTask.promise;
    
    // Check if text exists by checking a sample of pages (max 3 pages)
    const pagesToCheck = Math.min(pdfDocument.numPages, 3);
    let totalTextLength = 0;
    
    for (let pageNum = 1; pageNum <= pagesToCheck; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Count total text length on the page
        for (const item of textContent.items) {
          if ('str' in item) {
            totalTextLength += item.str.length;
          }
        }
      } catch (error) {
        console.warn(`Error checking page ${pageNum} for text:`, error);
      }
    }
    
    // If we found very little text, it's likely an image-based PDF
    return totalTextLength < 50;
  } catch (error) {
    console.error('Error checking if PDF is image-based:', error);
    // If we can't analyze, assume it might be image-based
    return true;
  }
} 