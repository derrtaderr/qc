import * as pdfjs from 'pdfjs-dist'
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'
import pdfParse from 'pdf-parse'

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

export interface PDFExtractResult {
  text: string
  numPages: number
  info: Record<string, any>
  error?: string
}

export class PDFService {
  static async extractText(file: File): Promise<PDFExtractResult> {
    try {
      const buffer = await file.arrayBuffer()
      const data = await pdfParse(buffer)

      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info
      }
    } catch (error) {
      return {
        text: '',
        numPages: 0,
        info: {},
        error: error instanceof Error ? error.message : 'Failed to extract text from PDF'
      }
    }
  }

  static async extractImages(file: File): Promise<Uint8Array[]> {
    try {
      const buffer = await file.arrayBuffer()
      const pdf = await getDocument({ data: buffer }).promise
      const images: Uint8Array[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const ops = await page.getOperatorList()
        const fnArray = ops.fnArray
        const argsArray = ops.argsArray

        for (let i = 0; i < fnArray.length; i++) {
          if (fnArray[i] === pdfjs.OPS.paintImageXObject) {
            const imageRef = argsArray[i][0]
            if (imageRef) {
              const obj = await page.objs.get(imageRef)
              if (obj?.data instanceof Uint8Array) {
                images.push(obj.data)
              }
            }
          }
        }
      }

      return images
    } catch (error) {
      console.error('Failed to extract images:', error)
      return []
    }
  }

  static async getPageCount(file: File): Promise<number> {
    try {
      const buffer = await file.arrayBuffer()
      const pdf = await getDocument({ data: buffer }).promise
      return pdf.numPages
    } catch (error) {
      console.error('Failed to get page count:', error)
      return 0
    }
  }

  static async validatePDF(file: File): Promise<{ isValid: boolean; error?: string }> {
    try {
      if (!file.type.includes('pdf')) {
        return { isValid: false, error: 'Not a PDF file' }
      }

      const buffer = await file.arrayBuffer()
      await getDocument({ data: buffer }).promise

      return { isValid: true }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid PDF file'
      }
    }
  }
} 