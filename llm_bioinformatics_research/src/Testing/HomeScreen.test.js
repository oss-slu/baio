import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import HomeScreen from '../Components/HomeScreen/HomeScreen';
import '@testing-library/jest-dom/extend-expect';

const renderWithRouter = (ui) => {
  return render(<Router>{ui}</Router>);
};

describe('HomeScreen Component Structure Tests', () => {
  test('checks if the Code input panel exists', () => {
    renderWithRouter(<HomeScreen />);

    const codeSnippetTitle = screen.getByPlaceholderText(/text input/i);
    expect(codeSnippetTitle).toBeInTheDocument();
  });

  test('checks if the API Recommendation Panel exists', () => {
    renderWithRouter(<HomeScreen />);

    const apiRecommendationTitle = screen.getByText(/API Recommendation Panel/i);
    expect(apiRecommendationTitle).toBeInTheDocument();
  });

  test('checks if the Error detection Panel exists', () => {
    renderWithRouter(<HomeScreen />);

    const errorDetectionPanel = screen.getByText(/Error detection Panel/i);
    expect(errorDetectionPanel).toBeInTheDocument();
  });

  test('checks if the Footer exists', () => {
    renderWithRouter(<HomeScreen />);

    const footer = screen.getByText(/Footer/i);
    expect(footer).toBeInTheDocument();
  });

  test('checks if the AI Chat and Response Panel exists with a text field', () => {
    renderWithRouter(<HomeScreen />);

    const aiChatResponsePanel = screen.getByText(/AI Chat and Response/i);
    expect(aiChatResponsePanel).toBeInTheDocument();
  });

  test('allows text input in the field', () => {
    renderWithRouter(<HomeScreen />);
    const textInput = screen.getByPlaceholderText(/text input/i);
    fireEvent.change(textInput, { target: { value: 'Testing input' } });
    expect(textInput.value).toBe('Testing input');
  });
});

describe('HomeScreen Component Panel Sizes', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
    window.dispatchEvent(new Event('resize'));
  });

  test('panels occupy the correct width and height percentages', () => {
    const { container } = renderWithRouter(<HomeScreen />);

    const mainContainer = container.firstChild;
    const mainWidth = mainContainer.clientWidth;
    const mainHeight = mainContainer.clientHeight;

    const leftPanel = screen.getByText(/AI Chat and Response/i).closest('div');
    const linksPanel = screen.getByText(/Associated Links for the generated chat/i).closest('div');
    const apiPanel = screen.getByText(/API Recommendation Panel/i).closest('div');
    const errorPanel = screen.getByText(/Error detection Panel/i).closest('div');

    expect(leftPanel.clientWidth).toBeGreaterThanOrEqual((mainWidth * 8) / 12); 
    expect(linksPanel.clientWidth).toBeGreaterThanOrEqual((mainWidth * 4) / 12);
    expect(apiPanel.clientWidth).toBeGreaterThanOrEqual((mainWidth * 4) / 12);
    expect(errorPanel.clientWidth).toBeGreaterThanOrEqual((mainWidth * 4) / 12);

    expect(leftPanel.clientHeight).toBeCloseTo(mainHeight * 0.95, -1); // 95% of main height
    expect(linksPanel.clientHeight).toBeGreaterThanOrEqual(mainHeight * 0.33); 
    expect(apiPanel.clientHeight).toBeGreaterThanOrEqual(mainHeight * 0.33);
    expect(errorPanel.clientHeight).toBeGreaterThanOrEqual(mainHeight * 0.33);
  });
});

describe('HomeScreen Component Dialog Functionality Tests', () => {
  test('opens logout confirmation dialog on back button press', () => {
    renderWithRouter(<HomeScreen />);
    
    fireEvent.popState(window);

    expect(screen.getByText(/confirm logout/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to log out\?/i)).toBeInTheDocument();
  });

  test('closes the dialog and stays on page when "Cancel" is clicked', async () => {
    renderWithRouter(<HomeScreen />);
    
    fireEvent.popState(window);

    expect(screen.getByText(/confirm logout/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/cancel/i));

    await waitFor(() => {
      expect(screen.queryByText(/confirm logout/i)).not.toBeInTheDocument();
    });
  });

  test('logs out and navigates to login page when "Logout" is clicked', () => {
    const mockSetIsLoggedIn = jest.fn();
    renderWithRouter(<HomeScreen setIsLoggedIn={mockSetIsLoggedIn} />);
    
    fireEvent.popState(window);

    expect(screen.getByText(/confirm logout/i)).toBeInTheDocument();

    const logoutButton = screen.getAllByText(/logout/i).find(button => button.tagName === 'BUTTON');
    fireEvent.click(logoutButton);

    expect(mockSetIsLoggedIn).toHaveBeenCalledWith(false);
  });
});
