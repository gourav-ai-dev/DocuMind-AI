import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as apiModule from './services/api';

// Mock the API module
vi.mock('./services/api');

// Mock the MainLayout component to simplify testing
vi.mock('./layout/MainLayout', () => ({
  default: () => <div>Main Layout</div>,
}));

const mockApi = apiModule as any;

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.api = {
      allDocs: vi.fn(),
      getChatHistory: vi.fn(),
      askAI: vi.fn(),
      deleteDoc: vi.fn(),
      uploadDoc: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    };
  });

  describe('Initial Render', () => {
    it('should render login page on initial load', () => {
      render(<App />);

      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('should not render register or main layout initially', () => {
      render(<App />);

      expect(screen.queryByRole('heading', { name: 'Register' })).not.toBeInTheDocument();
      expect(screen.queryByText('Main Layout')).not.toBeInTheDocument();
    });
  });

  describe('Navigation from Login to Register', () => {
    it('should navigate to register page when register link is clicked', () => {
      render(<App />);

      const registerLink = screen.getByText((content, element) => content.includes('have an account'));
      fireEvent.click(registerLink);

      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
    });
  });

  describe('Navigation from Register to Login', () => {
    it('should navigate back to login page when login link is clicked', () => {
      render(<App />);

      // First navigate to register
      const registerLink = screen.getByText((content, element) => content.includes('have an account'));
      fireEvent.click(registerLink);

      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();

      // Then navigate back to login
      const loginLink = screen.getByText((content, element) => content.includes('Already have an account'));
      fireEvent.click(loginLink);

      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Register' })).not.toBeInTheDocument();
    });
  });

  describe('Navigation from Login to App', () => {
    it('should navigate to main app after successful login', async () => {
      mockApi.api.login = vi.fn().mockResolvedValueOnce({ userId: 'user123' });

      render(<App />);

      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Main Layout')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
      });
    });
  });

  describe('Complete User Flow', () => {
    it('should allow user to register and then navigate to login', async () => {
      mockApi.api.register = vi.fn().mockResolvedValueOnce({ success: true });

      render(<App />);

      // Start at login page
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

      // Navigate to register
      const registerLink = screen.getByText((content, element) => content.includes('have an account'));
      fireEvent.click(registerLink);

      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();

      // Fill and submit register form
      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      // Should navigate back to login after successful registration
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
      });
    });

    it('should allow user to register, login, and access main app', async () => {
      mockApi.api.register = vi.fn().mockResolvedValueOnce({ success: true });
      mockApi.api.login = vi.fn().mockResolvedValueOnce({ userId: 'user123' });

      render(<App />);

      // Navigate to register
      const registerLink = screen.getByText((content, element) => content.includes('have an account'));
      fireEvent.click(registerLink);

      // Register new user
      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      // Should be back at login
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
      });

      // Now login
      const loginEmailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const loginPasswordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(loginEmailInput, 'newuser@example.com');
      await userEvent.type(loginPasswordInput, 'password123');
      fireEvent.click(loginButton);

      // Should be in main app
      await waitFor(() => {
        expect(screen.getByText('Main Layout')).toBeInTheDocument();
      });
    });
  });

  describe('Page State Persistence', () => {
    it('should maintain login page when clicking register button without navigating', () => {
      render(<App />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

      // Type something but don't submit
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });

      // Navigate to register
      const registerLink = screen.getByText((content, element) => content.includes('have an account'));
      fireEvent.click(registerLink);

      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();

      // Navigate back to login
      const loginLink = screen.getByText((content, element) => content.includes('Already have an account'));
      fireEvent.click(loginLink);

      // Login page should be fresh (no previous input values)
      const newEmailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      expect(newEmailInput.value).toBe('');
    });

    it('should allow multiple navigation cycles between login and register', () => {
      render(<App />);

      // First cycle
      let registerLink = screen.getByText((content, element) => content.includes('have an account'));
      fireEvent.click(registerLink);
      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();

      let loginLink = screen.getByText((content, element) => content.includes('Already have an account'));
      fireEvent.click(loginLink);
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

      // Second cycle
      registerLink = screen.getByText((content, element) => content.includes('have an account'));
      fireEvent.click(registerLink);
      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();

      loginLink = screen.getByText((content, element) => content.includes('Already have an account'));
      fireEvent.click(loginLink);
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    });
  });

  describe('App Page Display', () => {
    it('should render MainLayout when page is set to app', async () => {
      mockApi.api.login = vi.fn().mockResolvedValueOnce({ userId: 'user123' });

      render(<App />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Main Layout')).toBeInTheDocument();
      });

      // Ensure login and register are not visible
      expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Register' })).not.toBeInTheDocument();
    });
  });
});
