/*

Sign Up Page Testing:

This file tests the functionality of Sign Up page: 
~ tests that the page renders
~ tests that there is an error when the username field is empty
~ tests that there is an error when the email is not of a valid format
~ tests that there is an error when the password does not matche specified criteria
~ tests that their is an error when the password and the confirm password don't match
~ tests that there is no error when all requirements are met

*/

import React from 'react';
import { render, screen, fireEvent} from '@testing-library/react';
import { MemoryRouter} from 'react-router-dom';
import SignupScreen from '../Components/SignupScreen/SignupScreen';
import '@testing-library/jest-dom/extend-expect';

describe('SignupScreen', () => {

  test('should show an error if the username is empty', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const usernameInput = screen.getByTestId('username-input');
    fireEvent.change(usernameInput, { target: { value: '' } });

    const submitButton = screen.getByTestId('signup-button');
    fireEvent.click(submitButton);
  
    expect(screen.getByText('Username is required.')).toBeInTheDocument();
  });

  test('should show no error for valid email format', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );
    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });

    fireEvent.change(emailInput, { target: { value: 'validemail@example.com' } });
    fireEvent.click(submitButton);

    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
  });

  test('should show an error if the password is too short', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );
    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'validemail@example.com' } });

    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
  
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);
  
    expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
  });

  test('should show an error if password does not contain an uppercase letter', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'validemail@example.com' } });

    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
  
    fireEvent.change(passwordInput, { target: { value: 'lowercase123!' } });
    fireEvent.click(submitButton);
  
    expect(screen.getByText(/password must include at least one uppercase letter/i)).toBeInTheDocument();
  });

  test('should show an error if password does not contain a number', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'validemail@example.com' } });

    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
  
    fireEvent.change(passwordInput, { target: { value: 'NoNumber!' } });
    fireEvent.click(submitButton);
  
    expect(screen.getByText(/password must include at least one number/i)).toBeInTheDocument();
  });

  test('should show an error if password does not contain a special character', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'validemail@example.com' } });

    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
  
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);
  
    expect(screen.getByText(/password must include at least one special character/i)).toBeInTheDocument();
  });

  test('should show an error if passwords do not match', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'validemail@example.com' } });

    const passwordInput = screen.getByTestId('password-input');
    const retypePasswordInput = screen.getByTestId('retypePassword-input');
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
  
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(retypePasswordInput, { target: { value: 'DifferentPassword123!' } });
    fireEvent.click(submitButton);
  
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('should show no errors if all fields are valid', () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>
    );
    const usernameInput = screen.getByTestId('username-input');
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const retypePasswordInput = screen.getByTestId('retypePassword-input');
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
  
    fireEvent.change(usernameInput, { target: { value: 'validuser' } });
    fireEvent.change(emailInput, { target: { value: 'validemail@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(retypePasswordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);
  
    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
  });
});