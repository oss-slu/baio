import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeScreen from '../HomeScreen';
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

test('checks if the AppBar title exists', () => {
  render(<HomeScreen />);

  const appBarTitle = screen.getByText(/Better Bioinformatics/i);
  expect(appBarTitle).toBeInTheDocument();
});

test('checks if the Code Snippet (Input) panel exists', () => {
  render(<HomeScreen />);

  const codeSnippetTitle = screen.getByText(/Code Snippet \(Input\)/i);
  expect(codeSnippetTitle).toBeInTheDocument();

  const codeInputField = screen.getByPlaceholderText(/Enter code here.../i);
  expect(codeInputField).toBeInTheDocument();
});

test('checks if the API Recommendation Panel exists', () => {
  render(<HomeScreen />);

  const apiRecommendationTitle = screen.getByText(/API Recommendation Panel/i);
  expect(apiRecommendationTitle).toBeInTheDocument();
});

test('checks if the Error detection and Correction Panel exists', () => {
  render(<HomeScreen />);

  const errorDetectionPanel = screen.getByText(/Error detection and Correction Panel/i);
  expect(errorDetectionPanel).toBeInTheDocument();
});

test('checks if the Footer exists', () => {
  render(<HomeScreen />);

  const footer = screen.getByText(/Footer/i);
  expect(footer).toBeInTheDocument();
});
