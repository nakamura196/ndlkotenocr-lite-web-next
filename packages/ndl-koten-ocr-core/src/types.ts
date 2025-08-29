export interface Detection {
  box: number[];
  confidence: number;
  class: number;
}

export interface RecognizedDetection extends Detection {
  text: string;
}

export interface OCRResult {
  detections: RecognizedDetection[];
  xml: string;
  json: string;
  text: string;
}

export interface LayoutConfig {
  model_path?: string;
  confidence_threshold?: number;
  iou_threshold?: number;
}

export interface RecognizerConfig {
  model_path?: string;
  charset_path?: string;
  max_length?: number;
}

export interface ReadingOrderConfig {
  direction?: 'vertical' | 'horizontal';
  line_clustering_threshold?: number;
}

export interface OutputConfig {
  format?: 'xml' | 'json' | 'text' | 'all';
  include_confidence?: boolean;
}