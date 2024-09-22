import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeScreen from '../HomeScreen/HomeScreen';
import '@testing-library/jest-dom/extend-expect';

test('checks if the Code Snippet (Input) panel exists', () => {
  render(<HomeScreen />);

  const codeSnippetTitle = screen.getByText(/Code Snippet \(Input\)/i);
  expect(codeSnippetTitle).toBeInTheDocument();
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