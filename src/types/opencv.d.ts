declare module '@techstark/opencv-js' {
  export interface Mat {
    delete(): void;
    roi(rect: { x: number; y: number; width: number; height: number }): Mat;
    cols: number;
    rows: number;
    floatAt(row: number, col: number): number;
    intAt(row: number, col: number): number;
  }

  export interface MatVector {
    size(): number;
    get(index: number): Mat;
    delete(): void;
  }

  export const ready: Promise<void>;
  
  export function matFromImageData(imageData: ImageData): Mat;
  export function cvtColor(src: Mat, dst: Mat, code: number): void;
  export function threshold(src: Mat, dst: Mat, thresh: number, maxval: number, type: number): void;
  export function findContours(image: Mat, contours: MatVector, hierarchy: Mat, mode: number, method: number): void;
  export function boundingRect(contour: Mat): { x: number; y: number; width: number; height: number };
  export function connectedComponentsWithStats(
    image: Mat,
    labels: Mat,
    stats: Mat,
    centroids: Mat,
    connectivity: number,
    ltype: number
  ): number;
  export function reduce(src: Mat, dst: Mat, dim: number, rtype: number, dtype: number): void;
  export function calcHist(
    images: Mat[],
    channels: number[],
    mask: Mat,
    hist: Mat,
    histSize: number[],
    ranges: number[]
  ): void;

  // Constants
  export const COLOR_RGBA2GRAY: number;
  export const THRESH_BINARY_INV: number;
  export const THRESH_OTSU: number;
  export const RETR_EXTERNAL: number;
  export const CHAIN_APPROX_SIMPLE: number;
  export const CC_STAT_AREA: number;
  export const CC_STAT_WIDTH: number;
  export const CC_STAT_HEIGHT: number;
  export const CV_32S: number;
  export const CV_32F: number;
  export const REDUCE_SUM: number;
} 