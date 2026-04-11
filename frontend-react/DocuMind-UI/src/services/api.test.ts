import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api';

const BASE_URL = "http://localhost:5166/api";

// Mock fetch globally
globalThis.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const mockResponse = { userId: '123', email: 'test@example.com' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.register('test@example.com', 'password123');
      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/auth/register`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
    });

    it('should throw error on registration failure', async () => {
      const mockError = { error: 'Email already exists' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(api.register('test@example.com', 'password123')).rejects.toThrow(
        'Email already exists'
      );
    });

    it('should throw generic error when no error message provided', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(api.register('test@example.com', 'password123')).rejects.toThrow(
        'Registration failed'
      );
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockResponse = { userId: '123', token: 'abc123' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.login('test@example.com', 'password123');
      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('should throw error on login failure', async () => {
      const mockError = { error: 'Invalid credentials' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(api.login('test@example.com', 'wrong')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error if userId is missing from response', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'abc123' }),
      });

      await expect(api.login('test@example.com', 'password123')).rejects.toThrow(
        'Invalid login response'
      );
    });
  });

  describe('allDocs', () => {
    it('should fetch all documents', async () => {
      const mockDocs = [
        { id: '1', name: 'Doc1', content: 'content1' },
        { id: '2', name: 'Doc2', content: 'content2' },
      ];
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocs,
      });

      const result = await api.allDocs();
      expect(result).toEqual(mockDocs);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/documents`,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should throw error when fetch fails', async () => {
      const mockError = { error: 'Unauthorized' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(api.allDocs()).rejects.toThrow('Unauthorized');
    });

    it('should throw generic error when no error message provided', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(api.allDocs()).rejects.toThrow('Failed to fetch documents');
    });
  });

  describe('uploadDoc', () => {
    it('should successfully upload a document', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = { fileId: '123', fileName: 'test.pdf' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.uploadDoc(mockFile);
      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/document/upload`,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('should throw error on upload failure', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockError = { error: 'File too large' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(api.uploadDoc(mockFile)).rejects.toThrow('File too large');
    });

    it('should handle JSON parse error gracefully', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(api.uploadDoc(mockFile)).rejects.toThrow('File upload failed');
    });
  });

  describe('deleteDoc', () => {
    it('should successfully delete a document', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await api.deleteDoc('doc123');
      expect(result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/documents/doc123`,
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        })
      );
    });

    it('should throw error on delete failure', async () => {
      const mockError = { error: 'Document not found' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(api.deleteDoc('doc123')).rejects.toThrow('Document not found');
    });

    it('should handle JSON parse error gracefully', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(api.deleteDoc('doc123')).rejects.toThrow('Failed to delete document');
    });
  });

  describe('askAI', () => {
    it('should successfully query AI', async () => {
      const mockResponse = { answer: 'This is the answer', documentId: 'doc123' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.askAI('What is this document about?', 'doc123');
      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/ai/query`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'What is this document about?', documentId: 'doc123' }),
          credentials: 'include',
        })
      );
    });

    it('should return response even on error', async () => {
      const mockError = { error: 'Query failed' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const result = await api.askAI('test query', 'doc123');
      expect(result).toEqual(mockError);
    });
  });

  describe('getChatHistory', () => {
    it('should successfully fetch chat history', async () => {
      const mockHistory = [
        { id: '1', message: 'Hello', sender: 'user' },
        { id: '2', message: 'Hi there', sender: 'ai' },
      ];
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await api.getChatHistory('doc123');
      expect(result).toEqual(mockHistory);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/chat/doc123`,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should throw error on fetch failure', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(api.getChatHistory('doc123')).rejects.toThrow(
        'Failed to fetch chat history'
      );
    });
  });
});