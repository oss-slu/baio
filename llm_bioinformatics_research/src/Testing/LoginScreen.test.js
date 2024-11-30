/*

Login Screen Page Testing:

This file tests the functionality of the Login page: 
~ tests that the page renders
~ tests that all fields and buttons are visible
~ tests for the input of email and password in input fields
~ tests the toggle functionality of the password
~ tests that an error message appears when form is submitted with empty fields
~ tests that an error message appears when login is unsuccessful
~ tests that the user is redirected to home page upon successful login
~ test that navigation to forgot password page works as intended


*/

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginScreen from '../Components/LoginScreen/LoginScreen';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginScreen', () => {
  const setup = (props = {}) => render(
    <MemoryRouter>
      <LoginScreen {...props} />
    </MemoryRouter>
  );

  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.resetMocks();
    Storage.prototype.setItem = jest.fn();
  });

  test('renders login form inputs and buttons', () => {
    setup();
    expect(screen.getByTestId('login-heading')).toHaveTextContent('Login');
    expect(screen.getByTestId('identifier-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  test('allows entering email/username and password', () => {
    setup();
    userEvent.type(screen.getByTestId('identifier-input'), 'user@example.com');
    expect(screen.getByTestId('identifier-input')).toHaveValue('user@example.com');
    userEvent.type(screen.getByTestId('password-input'), 'password123');
    expect(screen.getByTestId('password-input')).toHaveValue('password123');
  });

  test('toggles password visibility', () => {
    setup();
    const passwordInput = screen.getByTestId('password-input');
    const toggleButton = screen.getByRole('button', { name: 'toggle password visibility' });
    expect(passwordInput).toHaveAttribute('type', 'password');
    userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('prevents submission with empty fields and shows an error message', async () => {
    setup();
    userEvent.click(screen.getByTestId('login-button'));
    await waitFor(() => {
      expect(screen.queryByTestId('login-error')).toBeInTheDocument();
      expect(screen.getByTestId('login-error')).toHaveTextContent('Both email/username and password are required.');
    });
  });

  test('shows an error message on failed login', async () => {
    setup();
    fetchMock.mockRejectOnce(new Error('Failed to fetch'));
    userEvent.type(screen.getByTestId('identifier-input'), 'user@example.com');
    userEvent.type(screen.getByTestId('password-input'), 'wrongpassword');
    userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent('An error occurred while trying to log in. Please try again.');
    });
  });

  test('successful login redirects to home page', async () => {
    const setIsLoggedIn = jest.fn();
    fetchMock.mockResponseOnce(JSON.stringify({ token: '12345', user: { id: 'user123', name: 'Test User' } }));

    setup({ setIsLoggedIn });
  
    await userEvent.type(screen.getByTestId('identifier-input'), 'test_user');
    await userEvent.type(screen.getByTestId('password-input'), 'Test_123#');
    await userEvent.click(screen.getByTestId('login-button'));
  
    await waitFor(() => {
      expect(Storage.prototype.setItem).toHaveBeenCalledWith('authToken', '12345');
      expect(Storage.prototype.setItem).toHaveBeenCalledWith('userData', JSON.stringify({ id: 'user123', name: 'Test User' }));
      expect(setIsLoggedIn).toHaveBeenCalledWith(true);
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });
  });

  test('navigates to forgot password page on link click', async () => {
    setup();
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    userEvent.click(forgotPasswordLink);
    await waitFor(() => {
      expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    });
  });

});