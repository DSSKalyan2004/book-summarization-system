import { SummaryResult, AuthResponse, UsersListResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

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

  // Upload file and extract text
  uploadFile: async (file: File): Promise<{ text: string; filename: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/summaries/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
};

export const authApi = {
  // Register a new user
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('Attempting registration with:', { name, email });
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      console.log('Registration response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration error response:', errorData);
        throw new Error(errorData.detail || errorData.error || errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      console.log('Registration successful, data:', data);
      return data;
    } catch (error: any) {
      console.error('Error registering user:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Login failed');
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error logging in:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get all users (admin only)
  getAllUsers: async (): Promise<UsersListResponse> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to fetch users');
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },
};
