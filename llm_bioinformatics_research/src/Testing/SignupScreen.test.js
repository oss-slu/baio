import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignupScreen from '../SignupScreen/SignupScreen';
import '@testing-library/jest-dom/extend-expect';

describe('SignupScreen', () => {
  it('renders the signup form correctly', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    expect(screen.getByTestId('signup-heading')).toHaveTextContent('Sign Up');
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('retype-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button')).toBeInTheDocument();
  });

  it('validates email input and shows error message', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const signUpButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(signUpButton);

    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
  });

  it('validates password input and shows error message', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const signUpButton = screen.getByTestId('signup-button');

    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(signUpButton);

    expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
  });

  it('validates password requiring at least one uppercase letter', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const signUpButton = screen.getByTestId('signup-button');

    fireEvent.change(passwordInput, { target: { value: 'password123!' } });
    fireEvent.click(signUpButton);

    expect(screen.getByText('Password must include at least one uppercase letter.')).toBeInTheDocument();
  });

  it('validates password requiring at least one lowercase letter', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const signUpButton = screen.getByTestId('signup-button');

    fireEvent.change(passwordInput, { target: { value: 'PASSWORD123!' } });
    fireEvent.click(signUpButton);

    expect(screen.getByText('Password must include at least one lowercase letter.')).toBeInTheDocument();
  });

  it('validates password requiring at least one number', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const signUpButton = screen.getByTestId('signup-button');

    fireEvent.change(passwordInput, { target: { value: 'Password!' } });
    fireEvent.click(signUpButton);

    expect(screen.getByText('Password must include at least one number.')).toBeInTheDocument();
  });

  it('validates password requiring at least one special character', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const signUpButton = screen.getByTestId('signup-button');

    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(signUpButton);

    expect(screen.getByText('Password must include at least one special character.')).toBeInTheDocument();
  });

  it('validates that passwords match and shows error message', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const retypePasswordInput = screen.getByTestId('retype-password-input');
    const signUpButton = screen.getByTestId('signup-button');

    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(retypePasswordInput, { target: { value: 'DifferentPassword!' } });
    fireEvent.click(signUpButton);

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('shows a success message when the form is submitted correctly', async () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const usernameInput = screen.getByTestId('username-input');
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const retypePasswordInput = screen.getByTestId('retype-password-input');
    const signUpButton = screen.getByTestId('signup-button');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(retypePasswordInput, { target: { value: 'Password123!' } });

    fireEvent.click(signUpButton);

    await waitFor(() => {
      expect(screen.getByTestId('signup-success-message')).toHaveTextContent(
        'Successfully signed up! You will be redirected to the login page in 5 seconds.'
      );
    });
  });

  it('toggles the password visibility', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const visibilityToggle = screen.getByLabelText('toggle password visibility');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('displays password matching message', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const retypePasswordInput = screen.getByTestId('retype-password-input');

    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(retypePasswordInput, { target: { value: 'Password123!' } });

    expect(screen.getByText('✓ Passwords match')).toBeInTheDocument();
  });
});
