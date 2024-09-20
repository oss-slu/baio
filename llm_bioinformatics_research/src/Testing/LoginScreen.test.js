import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginScreen from '../LoginScreen/LoginScreen';

console.log = jest.fn();

describe('LoginScreen Component', () => {
  test('should show error for invalid email format', () => {
    render(<LoginScreen />);
    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  test('should show no error for valid email format', () => {
    render(<LoginScreen />);
    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'validemail@example.com' } });
    fireEvent.click(submitButton);

    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
  });

  test('should show error when email is empty', () => {
    render(<LoginScreen />);
    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  test('should show error for password that is too short', () => {
    render(<LoginScreen />);
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(passwordInput, { target: { value: 'Ab1!' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/at least 8 characters long/i)).toBeInTheDocument();
  });

  test('should show error for missing uppercase letter in password', () => {
    render(<LoginScreen />);
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(passwordInput, { target: { value: 'abcdef12!' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/at least one uppercase letter./i)).toBeInTheDocument();
  });

  test('should show error for missing lowercase letter in password', () => {
    render(<LoginScreen />);
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(passwordInput, { target: { value: 'ABCDEF12!' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/at least one lowercase letter./i)).toBeInTheDocument();
  });

  test('should show error for missing number in password', () => {
    render(<LoginScreen />);
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(passwordInput, { target: { value: 'Abcdefgh!' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/at least one number./i)).toBeInTheDocument();
  });

  test('should show error for password missing special character', () => {
    render(<LoginScreen />);
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(passwordInput, { target: { value: 'Abcdef12' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/at least one special character/i)).toBeInTheDocument();
  });

  test('should show no error for valid password', () => {
    render(<LoginScreen />);
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(passwordInput, { target: { value: 'Abcdef12!' } });
    fireEvent.click(submitButton);

    expect(screen.queryByText(/password must be at least 8 characters long./i)).not.toBeInTheDocument();
  });

  test('should call console.log on valid submission', () => {
    render(<LoginScreen />);
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'validemail@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Abcdef12!' } });
    fireEvent.click(submitButton);

    expect(console.log).toHaveBeenCalledWith('Form submitted');
  });

  test('should not call console.log on invalid submission', () => {
    render(<LoginScreen />);
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.change(passwordInput, { target: { value: 'Ab1!' } });
    fireEvent.click(submitButton);

    expect(console.log).not.toHaveBeenCalled();
  });
});
