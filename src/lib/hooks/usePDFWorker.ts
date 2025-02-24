import { useCallback, useEffect, useRef, useState } from 'react';

interface PDFWorkerState {
  isLoading: boolean;
  error: string | null;
  text: string | null;
  images: Uint8Array[] | null;
  pageCount: number | null;
}

interface UsePDFWorkerResult extends PDFWorkerState {
  extractText: (file: File) => Promise<void>;
  extractImages: (file: File) => Promise<void>;
  getPageCount: (file: File) => Promise<void>;
  reset: () => void;
}

export function usePDFWorker(): UsePDFWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<PDFWorkerState>({
    isLoading: false,
    error: null,
    text: null,
    images: null,
    pageCount: null,
  });

  useEffect(() => {
    // Initialize worker
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/pdf.worker.ts', import.meta.url)
      );

      // Set up message handler
      workerRef.current.onmessage = (e: MessageEvent) => {
        const { type, data, error } = e.data;

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error || null,
          ...(type === 'text_extracted' && { text: data }),
          ...(type === 'images_extracted' && { images: data }),
          ...(type === 'page_count' && { pageCount: data }),
        }));
      };

      // Set up error handler
      workerRef.current.onerror = (error) => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      };
    }

    // Cleanup worker on unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processFile = useCallback(async (file: File, type: string) => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const arrayBuffer = await file.arrayBuffer();
    workerRef.current.postMessage({ type, fileData: arrayBuffer });
  }, []);

  const extractText = useCallback(async (file: File) => {
    await processFile(file, 'extract_text');
  }, [processFile]);

  const extractImages = useCallback(async (file: File) => {
    await processFile(file, 'extract_images');
  }, [processFile]);

  const getPageCount = useCallback(async (file: File) => {
    await processFile(file, 'get_page_count');
  }, [processFile]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      text: null,
      images: null,
      pageCount: null,
    });
  }, []);

  return {
    ...state,
    extractText,
    extractImages,
    getPageCount,
    reset,
  };
} 