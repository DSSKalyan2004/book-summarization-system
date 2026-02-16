
export interface BookMetadata {
  title: string;
}

export interface SummaryResult {
  id: string;
  metadata: BookMetadata;
  fullText: string;
  summaryParagraphs: string[];
  bulletPoints: string[];
  wordCount: number;
  processingTime: number;
  timestamp: number;
}

export enum Page {
  UPLOAD = 'upload',
  HISTORY = 'history',
  ABOUT = 'about'
}
