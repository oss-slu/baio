import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen', () => {
  render(<App />);
  const loginHeading = screen.getByText(/login screen/i);
  expect(loginHeading).toBeInTheDocument();
});

