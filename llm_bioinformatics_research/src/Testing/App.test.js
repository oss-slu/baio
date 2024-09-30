import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

test('renders login screen', () => {
  render(<App />);
  const loginButton = screen.getByTestId('login-button'); 
  expect(loginButton).toBeInTheDocument();
});
