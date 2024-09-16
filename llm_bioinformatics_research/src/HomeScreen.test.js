import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeScreen from './HomeScreen';
import '@testing-library/jest-dom/extend-expect';

test('checks if the API documentation button exists', () => {
  render(<HomeScreen />);

  const apiDocButton = screen.getByText(/API documentation/i);

  expect(apiDocButton).toBeInTheDocument();
});

test('checks if the Guidelines button exists', () => {
    render(<HomeScreen />);
  
    const guidelinesButton = screen.getByText(/Guidelines/i);
  
    expect(guidelinesButton).toBeInTheDocument();
  });

  test('checks if the Home button exists', () => {
    render(<HomeScreen />);
  
    const homeButton = screen.getByText(/Home/i);
  
    expect(homeButton).toBeInTheDocument();
  });

  test('checks if the User Profile button exists', () => {
    render(<HomeScreen />);
  
    const userProfileButton = screen.getByText(/User Profile/i);
  
    expect(userProfileButton).toBeInTheDocument();
  });