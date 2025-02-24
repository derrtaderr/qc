import * as pdfjs from 'pdfjs-dist';
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFWorkerMessage {
  type: 'extract_text' | 'extract_images' | 'get_page_count';
  fileData: ArrayBuffer;
}

interface PDFWorkerResponse {
  type: string;
  data: any;
  error?: string;
}

// Listen for messages from the main thread
self.addEventListener('message', async (e: MessageEvent<PDFWorkerMessage>) => {
  const { type, fileData } = e.data;

  try {
    switch (type) {
      case 'extract_text':
        const textResult = await extractText(fileData);
        self.postMessage({ type: 'text_extracted', data: textResult });
        break;

      case 'extract_images':
        const imageResult = await extractImages(fileData);
        self.postMessage({ type: 'images_extracted', data: imageResult });
        break;

      case 'get_page_count':
        const pageCount = await getPageCount(fileData);
        self.postMessage({ type: 'page_count', data: pageCount });
        break;

      default:
        throw new Error('Unknown message type');
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

async function extractText(fileData: ArrayBuffer): Promise<string> {
  const pdf = await getDocument({ data: fileData }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }

  return text;
}

async function extractImages(fileData: ArrayBuffer): Promise<Uint8Array[]> {
  const pdf = await getDocument({ data: fileData }).promise;
  const images: Uint8Array[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const ops = await page.getOperatorList();
    const fnArray = ops.fnArray;
    const argsArray = ops.argsArray;

    for (let i = 0; i < fnArray.length; i++) {
      if (fnArray[i] === pdfjs.OPS.paintImageXObject) {
        const imageRef = argsArray[i][0];
        if (imageRef) {
          const obj = await page.objs.get(imageRef);
          if (obj?.data instanceof Uint8Array) {
            images.push(obj.data);
          }
        }
      }
    }
  }

  return images;
}

async function getPageCount(fileData: ArrayBuffer): Promise<number> {
  const pdf = await getDocument({ data: fileData }).promise;
  return pdf.numPages;
}

export {}; // Required for TypeScript modules 