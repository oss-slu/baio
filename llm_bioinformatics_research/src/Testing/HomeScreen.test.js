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

  const errorDetectionPanel = screen.getByText(/Error detection Panel/i);
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
  const aiOutputTextField = screen.getByText(/AI Output/i);
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

test('renders upload button', () => {
  render(<HomeScreen />);
  const uploadButton = screen.getByLabelText(/Upload/i);
  expect(uploadButton).toBeInTheDocument();
});

test('renders send button', () => {
  render(<HomeScreen />);
  const sendButton = screen.getByLabelText(/Send/i);
  expect(sendButton).toBeInTheDocument();
});

test('renders refresh button', () => {
  render(<HomeScreen />);
  const refreshButton = screen.getByLabelText(/Refresh/i);
  expect(refreshButton).toBeInTheDocument();
});

test('renders edit button', () => {
  render(<HomeScreen />);
  const editButton = screen.getByLabelText(/Edit/i);
  expect(editButton).toBeInTheDocument();
});

describe('HomeScreen Component Panel Sizes', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
    window.dispatchEvent(new Event('resize'));
  });

  afterAll(() => {
    delete window.innerWidth;
    delete window.innerHeight;
  });

  test('panels fill up the correct percentage of the screen width', () => {
    const { container } = render(<HomeScreen />);

    const mainContainer = container.firstChild; // Assuming this is the main Box component
    const mainWidth = mainContainer.clientWidth;
    const mainHeight = mainContainer.clientHeight;

    const leftPanel = screen.getByText(/AI Chat and Response/i).closest('div'); // Adjust selector if necessary
    const leftWidth = leftPanel.clientWidth;

    const linksPanel = screen.getByText(/Associated Links for the generated chat/i).closest('div');
    const linksWidth = linksPanel.clientWidth;

    const apiPanel = screen.getByText(/API Recommendation Panel/i).closest('div');
    const apiWidth = apiPanel.clientWidth;

    const errorPanel = screen.getByText(/Error detection Panel/i).closest('div');
    const errorWidth = errorPanel.clientWidth;

    expect(leftWidth).toBeGreaterThanOrEqual((mainWidth * 8) / 12); 
    expect(linksWidth).toBeGreaterThanOrEqual((mainWidth * 4) / 12); 
    expect(apiWidth).toBeGreaterThanOrEqual((mainWidth * 4) / 12); 
    expect(errorWidth).toBeGreaterThanOrEqual((mainWidth * 4) / 12);
  });

  test('panels fill up the correct percentage of the screen height', () => {
    const { container } = render(<HomeScreen />);

    const mainContainer = container.firstChild; 
    const mainHeight = mainContainer.clientHeight;

    const leftPanel = screen.getByText(/AI Chat and Response/i).closest('div'); 
    const leftHeight = leftPanel.clientHeight;

    const linksPanel = screen.getByText(/Associated Links for the generated chat/i).closest('div');
    const linksHeight = linksPanel.clientHeight;

    const apiPanel = screen.getByText(/API Recommendation Panel/i).closest('div');
    const apiHeight = apiPanel.clientHeight;

    const errorPanel = screen.getByText(/Error detection Panel/i).closest('div');
    const errorHeight = errorPanel.clientHeight;
    const errorWidth = errorPanel.clientWidth;

    expect(leftHeight).toBeGreaterThanOrEqual(mainHeight * 0.95); 
    expect(linksHeight).toBeGreaterThanOrEqual(mainHeight * 0.33); 
    expect(apiHeight).toBeGreaterThanOrEqual(mainHeight * 33); 
    expect(errorHeight).toBeGreaterThanOrEqual(mainHeight * 33);
  });

});