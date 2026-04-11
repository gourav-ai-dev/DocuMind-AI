import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from './Register';
import * as apiModule from '../services/api';

// Mock the API module
vi.mock('../services/api');

const mockApi = apiModule as any;

describe('Register Component', () => {
  const mockOnSwitch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render register form with all inputs and button', () => {
      render(<Register onSwitch={mockOnSwitch} />);

      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    });

    it('should render login link', () => {
      render(<Register onSwitch={mockOnSwitch} />);

      expect(screen.getByText((content, element) => content.includes('Already have an account'))).toBeInTheDocument();
    });

    it('should have register button enabled initially', () => {
      render(<Register onSwitch={mockOnSwitch} />);

      const registerButton = screen.getByRole('button', { name: 'Register' });
      expect(registerButton).not.toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      render(<Register onSwitch={mockOnSwitch} />);

      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Email and password are required')).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Email and password are required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'invalidemail');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should show error when password is less than 6 characters', async () => {
      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'pass');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('should trim whitespace from email and password', async () => {
      render(<Register onSwitch={mockOnSwitch} />);

      mockApi.api.register = vi.fn().mockResolvedValueOnce({ success: true });

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, '  test@example.com  ');
      await userEvent.type(passwordInput, '  password123  ');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(mockApi.api.register).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('Successful Registration', () => {
    it('should successfully register with valid credentials', async () => {
      mockApi.api.register = vi.fn().mockResolvedValueOnce({ success: true });

      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(mockApi.api.register).toHaveBeenCalledWith('newuser@example.com', 'password123');
        expect(mockOnSwitch).toHaveBeenCalled();
      });
    });

    it('should show loading state while registering', async () => {
      mockApi.api.register = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      // Button should show loading text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Registering...' })).toBeInTheDocument();
      });

      // Wait for registration to complete
      await waitFor(() => {
        expect(mockOnSwitch).toHaveBeenCalled();
      });
    });

    it('should disable register button during submission', async () => {
      mockApi.api.register = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Registering...' })).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on registration failure', async () => {
      mockApi.api.register = vi.fn().mockRejectedValueOnce(new Error('Email already exists'));

      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'existing@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Registration failed. Please check your email and password.')).toBeInTheDocument();
      });
    });

    it('should clear error message on new registration attempt', async () => {
      mockApi.api.register = vi.fn()
        .mockRejectedValueOnce(new Error('Email already exists'))
        .mockResolvedValueOnce({ success: true });

      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      // First registration attempt (fails)
      await userEvent.type(emailInput, 'existing@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Registration failed. Please check your email and password.')).toBeInTheDocument();
      });

      // Clear inputs and try again
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.change(passwordInput, { target: { value: '' } });

      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'password456');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.queryByText('Registration failed. Please check your email and password.')).not.toBeInTheDocument();
      });
    });

    it('should re-enable button after failed registration', async () => {
      mockApi.api.register = vi.fn().mockRejectedValueOnce(new Error('Email already exists'));

      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, 'existing@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Registration failed. Please check your email and password.')).toBeInTheDocument();
      });

      // Button should be enabled again
      expect(registerButton).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onSwitch when login link is clicked', () => {
      render(<Register onSwitch={mockOnSwitch} />);

      const loginLink = screen.getByText((content, element) => content.includes('Already have an account'));
      fireEvent.click(loginLink);

      expect(mockOnSwitch).toHaveBeenCalled();
    });

    it('should update input values as user types', async () => {
      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'password123');

      expect(emailInput.value).toBe('newuser@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });

  describe('Use trimmed values for registration', () => {
    it('should use trimmed email and password values in API call', async () => {
      mockApi.api.register = vi.fn().mockResolvedValueOnce({ success: true });

      render(<Register onSwitch={mockOnSwitch} />);

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await userEvent.type(emailInput, '  test@example.com  ');
      await userEvent.type(passwordInput, '  password123  ');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(mockApi.api.register).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });
});
