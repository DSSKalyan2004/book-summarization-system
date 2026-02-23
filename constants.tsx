
import React from 'react';
import { FileUp, History, Info, Users } from 'lucide-react';

export const APP_NAME = "SummAI";
export const FULL_APP_NAME = "Intelligent Book Summarization Platform";

export const NAV_ITEMS = [
  { id: 'upload', label: 'Summarizer', icon: <FileUp size={20} /> },
  { id: 'history', label: 'History', icon: <History size={20} /> },
  { id: 'about', label: 'About', icon: <Info size={20} /> },
];

export const ADMIN_NAV_ITEMS = [
  { id: 'upload', label: 'Summarizer', icon: <FileUp size={20} /> },
  { id: 'history', label: 'History', icon: <History size={20} /> },
  { id: 'users', label: 'Users', icon: <Users size={20} /> },
  { id: 'about', label: 'About', icon: <Info size={20} /> },
];
