
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

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export enum Page {
  UPLOAD = 'upload',
  HISTORY = 'history',
  ABOUT = 'about'
}
