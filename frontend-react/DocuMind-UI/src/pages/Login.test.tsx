import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import * as apiModule from '../services/api';
import * as authModule from '../utils/auth';

// Mock the API module
vi.mock('../services/api');

// Mock the auth module
vi.mock('../utils/auth');

const mockApi = apiModule as any;
const mockAuth = authModule as any;

describe('Login Component', () => {
  const mockOnLogin = vi.fn();
  const mockOnSwitch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.setAuth = vi.fn();
  });

  describe('Initial Render', () => {
    it('should render login form with all inputs and button', () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });

    it('should render register and forgot password links', () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      expect(screen.getByText((content, element) => content.includes('have an account'))).toBeInTheDocument();
      expect(screen.getByText((content, element) => content.includes('Forgot Password'))).toBeInTheDocument();
    });

    it('should have login button enabled initially', () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const loginButton = screen.getByRole('button', { name: 'Login' });
      expect(loginButton).not.toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Email and password are required')).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Email and password are required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'invalidemail');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should show error when password is less than 6 characters', async () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'pass');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('should trim whitespace from email and password', async () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      mockApi.api.login = vi.fn().mockResolvedValueOnce({ userId: '123' });

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, '  test@example.com  ');
      await userEvent.type(passwordInput, '  password123  ');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockApi.api.login).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('Successful Login', () => {
    it('should successfully login with valid credentials', async () => {
      mockApi.api.login = vi.fn().mockResolvedValueOnce({ userId: 'user123' });

      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockApi.api.login).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockAuth.setAuth).toHaveBeenCalledWith('user123');
        expect(mockOnLogin).toHaveBeenCalled();
      });
    });

    it('should show loading state while logging in', async () => {
      mockApi.api.login = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ userId: 'user123' }), 100))
      );

      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      // Button should show loading text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Logging in...' })).toBeInTheDocument();
      });

      // Wait for login to complete
      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalled();
      });
    });

    it('should disable login button during submission', async () => {
      mockApi.api.login = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ userId: 'user123' }), 100))
      );

      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
      mockApi.api.login = vi.fn().mockRejectedValueOnce(new Error('Invalid credentials'));

      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please check your email and password.')).toBeInTheDocument();
      });
    });

    it('should clear error message on new login attempt', async () => {
      mockApi.api.login = vi.fn()
        .mockRejectedValueOnce(new Error('Invalid credentials'))
        .mockResolvedValueOnce({ userId: 'user123' });

      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      // First login attempt (fails)
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please check your email and password.')).toBeInTheDocument();
      });

      // Clear inputs and try again
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.change(passwordInput, { target: { value: '' } });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'correctpassword');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.queryByText('Login failed. Please check your email and password.')).not.toBeInTheDocument();
      });
    });

    it('should re-enable button after failed login', async () => {
      mockApi.api.login = vi.fn().mockRejectedValueOnce(new Error('Invalid credentials'));

      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please check your email and password.')).toBeInTheDocument();
      });

      // Button should be enabled again
      expect(loginButton).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onSwitch when register link is clicked', () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const registerLink = screen.getByText((content, element) => content.includes('have an account'));
      fireEvent.click(registerLink);

      expect(mockOnSwitch).toHaveBeenCalled();
    });

    it('should show alert for forgot password', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const forgotPasswordLink = screen.getByText((content, element) => content.includes('Forgot Password'));
      fireEvent.click(forgotPasswordLink);

      expect(alertSpy).toHaveBeenCalledWith('Coming soon');
      alertSpy.mockRestore();
    });

    it('should update input values as user types', async () => {
      render(<Login onLogin={mockOnLogin} onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });
});
