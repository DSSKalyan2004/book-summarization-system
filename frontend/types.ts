
export interface BookMetadata {
  title: string;
}

export interface TableRow {
  concept: string;
  explanation: string;
}

export interface SummaryResult {
  id: string;
  metadata: BookMetadata;
  fullText: string;
  summaryParagraphs: string[];
  bulletPoints: string[];
  tableRows?: TableRow[];
  flowSteps?: string[];
  wordCount: number;
  processingTime: number;
  timestamp: number;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface UsersListResponse {
  users: User[];
  count: number;
}

export interface LoginEvent {
  userId: string;
  email: string;
  name: string;
  role: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export enum Page {
  UPLOAD = 'upload',
  HISTORY = 'history',
  ABOUT = 'about',
  USERS = 'users'
}
