import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  test('renders login button on the login screen', () => {
    window.matchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    render(<App/>);
    const loginButton = screen.getByTestId('login-button'); 
    expect(loginButton).toBeInTheDocument();
  });
});