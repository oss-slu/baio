import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeScreen from '../HomeScreen/HomeScreen';
import '@testing-library/jest-dom/extend-expect';
import App from '../App';

test('checks if the Code input panel exists', () => {
  render(<HomeScreen />);

  const codeSnippetTitle = screen.getByPlaceholderText(/text input/i);
  expect(codeSnippetTitle).toBeInTheDocument();
});

test('checks if the API Recommendation Panel exists', () => {
  render(<HomeScreen />);

  const apiRecommendationTitle = screen.getByText(/API Recommendation Panel/i);
  expect(apiRecommendationTitle).toBeInTheDocument();
});

test('checks if the Error detection Panel exists', () => {
  render(<HomeScreen />);

  const errorDetectionPanel = screen.getByText(/Error detection/i);
  expect(errorDetectionPanel).toBeInTheDocument();
});

test('checks if the Footer exists', () => {
  render(<HomeScreen />);

  const footer = screen.getByText(/Footer/i);
  expect(footer).toBeInTheDocument();
});

test('checks if the AI Chat and Response Panel exists with a text field', () => {
  render(<HomeScreen />);

  const aiChatResponsePanel = screen.getByText(/AI Chat and Response/i);
  expect(aiChatResponsePanel).toBeInTheDocument();
  const aiOutputTextField = screen.getByPlaceholderText(/AI Output/i);
  expect(aiOutputTextField).toBeInTheDocument();
});

test('renders text input field', () => {
  render(<HomeScreen />);
  const textInput = screen.getByPlaceholderText(/text input/i);
  expect(textInput).toBeInTheDocument();
});

test('allows text input in the field', () => {
  render(<HomeScreen />);
  const textInput = screen.getByPlaceholderText(/text input/i);
  fireEvent.change(textInput, { target: { value: 'Testing input' } });
  expect(textInput.value).toBe('Testing input');
});

test('renders upload, send, refresh, and edit buttons', () => {
  render(<HomeScreen />);
  const uploadButton = screen.getByLabelText(/Upload/i);
  const sendButton = screen.getByLabelText(/Send/i);
  const refreshButton = screen.getByLabelText(/Refresh/i);
  const editButton = screen.getByLabelText(/Edit/i); 
  
  expect(uploadButton).toBeInTheDocument();
  expect(sendButton).toBeInTheDocument();
  expect(refreshButton).toBeInTheDocument();
  expect(editButton).toBeInTheDocument();
});
