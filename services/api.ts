import { SummaryResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const summaryApi = {
  // Get all summaries
  getAll: async (): Promise<SummaryResult[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/summaries`);
      if (!response.ok) throw new Error('Failed to fetch summaries');
      return await response.json();
    } catch (error) {
      console.error('Error fetching summaries:', error);
      throw error;
    }
  },

  // Get single summary by ID
  getById: async (id: string): Promise<SummaryResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/summaries/${id}`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  },

  // Create new summary
  create: async (summary: SummaryResult): Promise<SummaryResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(summary),
      });
      if (!response.ok) throw new Error('Failed to create summary');
      return await response.json();
    } catch (error) {
      console.error('Error creating summary:', error);
      throw error;
    }
  },

  // Delete summary by ID
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/summaries/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete summary');
    } catch (error) {
      console.error('Error deleting summary:', error);
      throw error;
    }
  },

  // Update summary
  update: async (id: string, summary: Partial<SummaryResult>): Promise<SummaryResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/summaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(summary),
      });
      if (!response.ok) throw new Error('Failed to update summary');
      return await response.json();
    } catch (error) {
      console.error('Error updating summary:', error);
      throw error;
    }
  },
};
