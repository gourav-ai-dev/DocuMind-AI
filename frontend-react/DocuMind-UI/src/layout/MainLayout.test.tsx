import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainLayout from './MainLayout';
import * as apiModule from '../services/api';

// Mock the API module
vi.mock('../services/api');

// Mock the FormattedMessage component
vi.mock('../components/FormattedMessage', () => ({
  FormattedMessage: ({ text }: { text: string }) => <div>{text}</div>,
}));

const mockApi = apiModule as any;

describe('MainLayout Component', () => {
  const mockDocs = [
    { id: '1', fileName: 'Document1.pdf' },
    { id: '2', fileName: 'Document2.pdf' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.api = {
      allDocs: vi.fn(),
      getChatHistory: vi.fn(),
      askAI: vi.fn(),
      deleteDoc: vi.fn(),
      uploadDoc: vi.fn(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial Render', () => {
    it('should render loading state initially', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);

      render(<MainLayout />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should fetch and display documents on mount', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);

      render(<MainLayout />);

      await waitFor(() => {
        expect(mockApi.api.allDocs).toHaveBeenCalledOnce();
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
        expect(screen.getByText('Document2.pdf')).toBeInTheDocument();
      });
    });

    it('should display default header text when no document selected', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Select a document')).toBeInTheDocument();
      });
    });

    it('should handle fetch documents error gracefully', async () => {
      mockApi.api.allDocs.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<MainLayout />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Document Selection', () => {
    it('should select a document and load chat history', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);
      mockApi.api.getChatHistory.mockResolvedValueOnce([
        { question: 'What is this?', answer: 'This is a document' },
      ]);

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const doc1 = screen.getByText('Document1.pdf').closest('.doc-item');
      fireEvent.click(doc1!);

      await waitFor(() => {
        expect(mockApi.api.getChatHistory).toHaveBeenCalledWith('1');
        expect(screen.getByText('What is this?')).toBeInTheDocument();
        expect(screen.getByText('This is a document')).toBeInTheDocument();
      });
    });

    it('should update header when document is selected', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);
      mockApi.api.getChatHistory.mockResolvedValueOnce([]);

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const doc1 = screen.getByText('Document1.pdf').closest('.doc-item');
      fireEvent.click(doc1!);

      await waitFor(() => {
        const headers = screen.getAllByText('Document1.pdf');
        expect(headers.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should handle chat history fetch error', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);
      mockApi.api.getChatHistory.mockRejectedValueOnce(new Error('Failed to load'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const doc1 = screen.getByText('Document1.pdf').closest('.doc-item');
      fireEvent.click(doc1!);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Message Sending', () => {
    it('should send a message and receive AI response', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);
      mockApi.api.getChatHistory.mockResolvedValueOnce([]);
      mockApi.api.askAI.mockResolvedValueOnce({ answer: 'AI response' });

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const doc1 = screen.getByText('Document1.pdf').closest('.doc-item');
      fireEvent.click(doc1!);

      const input = screen.getByPlaceholderText('Ask something about document...') as HTMLInputElement;
      await userEvent.type(input, 'What is this?');

      const sendButton = screen.getByRole('button', { name: 'Send' });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockApi.api.askAI).toHaveBeenCalledWith('What is this?', '1');
        expect(screen.getByText('What is this?')).toBeInTheDocument();
        expect(screen.getByText('AI response')).toBeInTheDocument();
      });
    });

    it('should clear input after sending message', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);
      mockApi.api.getChatHistory.mockResolvedValueOnce([]);
      mockApi.api.askAI.mockResolvedValueOnce({ answer: 'Response' });

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const doc1 = screen.getByText('Document1.pdf').closest('.doc-item');
      fireEvent.click(doc1!);

      const input = screen.getByPlaceholderText(
        'Ask something about document...'
      ) as HTMLInputElement;
      await userEvent.type(input, 'Test message');

      const sendButton = screen.getByRole('button', { name: 'Send' });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should not send message if no document is selected', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Ask something about document...') as HTMLInputElement;
      await userEvent.type(input, 'Test');

      const sendButton = screen.getByRole('button', { name: 'Send' });
      fireEvent.click(sendButton);

      expect(mockApi.api.askAI).not.toHaveBeenCalled();
    });

    it('should handle AI error gracefully', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);
      mockApi.api.getChatHistory.mockResolvedValueOnce([]);
      mockApi.api.askAI.mockRejectedValueOnce(new Error('AI error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const doc1 = screen.getByText('Document1.pdf').closest('.doc-item');
      fireEvent.click(doc1!);

      const input = screen.getByPlaceholderText('Ask something about document...') as HTMLInputElement;
      await userEvent.type(input, 'Test');

      const sendButton = screen.getByRole('button', { name: 'Send' });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Document Deletion', () => {
    it('should delete a document', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);
      mockApi.api.deleteDoc.mockResolvedValueOnce(true);

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockApi.api.deleteDoc).toHaveBeenCalledWith('1');
      });
    });

    it('should clear messages if selected document is deleted', async () => {
      mockApi.api.allDocs.mockResolvedValueOnce(mockDocs);
      mockApi.api.getChatHistory.mockResolvedValueOnce([
        { question: 'Q', answer: 'A' },
      ]);
      mockApi.api.deleteDoc.mockResolvedValueOnce(true);

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const doc1 = screen.getByText('Document1.pdf').closest('.doc-item');
      fireEvent.click(doc1!);

      await waitFor(() => {
        expect(screen.getByText('Q')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Q')).not.toBeInTheDocument();
      });
    });
  });

  describe('Document Upload', () => {
    it('should upload a document', async () => {
      mockApi.api.allDocs
        .mockResolvedValueOnce(mockDocs)
        .mockResolvedValueOnce([...mockDocs, { id: '3', fileName: 'New.pdf' }]);
      mockApi.api.uploadDoc.mockResolvedValueOnce({ success: true });

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole('button', { name: /Upload/ });
      fireEvent.click(uploadButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'newfile.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockApi.api.uploadDoc).toHaveBeenCalledWith(file);
      });
    });

    it('should refresh documents after upload', async () => {
      const newDocs = [...mockDocs, { id: '3', fileName: 'New.pdf' }];
      mockApi.api.allDocs
        .mockResolvedValueOnce(mockDocs)
        .mockResolvedValueOnce(newDocs);
      mockApi.api.uploadDoc.mockResolvedValueOnce({ success: true });
      mockApi.api.getChatHistory.mockResolvedValueOnce([]);

      render(<MainLayout />);

      await waitFor(() => {
        expect(screen.getByText('Document1.pdf')).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole('button', { name: /Upload/ });
      fireEvent.click(uploadButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'newfile.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockApi.api.allDocs).toHaveBeenCalledTimes(2);
      });
    });
  });
});