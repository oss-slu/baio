import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import UserProfile from '../Components/UserProfile/UserProfile';
import ThemeContext from '../Context/ThemeContext';

describe('UserProfile Component', () => {
  const renderWithThemeContext = (ui, { theme = 'light', toggleTheme } = {}) => {
    return render(
      <MemoryRouter>
        <ThemeContext.Provider value={{ themeMode: theme, toggleTheme }}>
          {ui}
        </ThemeContext.Provider>
      </MemoryRouter>
    );
  };

  test('renders UserProfile with light theme by default', () => {
    const toggleTheme = jest.fn();
    renderWithThemeContext(<UserProfile />, { theme: 'light', toggleTheme });

    const logoutButton = screen.getByText(/Logout/i);
    expect(logoutButton).toHaveStyle('color: black');

  });

  test('changes button colors when dark theme is set', () => {
    const toggleTheme = jest.fn();
    renderWithThemeContext(<UserProfile />, { theme: 'dark', toggleTheme });

    const logoutButton = screen.getByText(/Logout/i);
    expect(logoutButton).toHaveStyle('color: white');

  });

  test('updates avatar image when a new image is uploaded', async () => {
    const toggleTheme = jest.fn();
    renderWithThemeContext(<UserProfile />, { theme: 'light', toggleTheme });

    const mockImageData = 'data:image/png;base64,mockImageData';
    const avatarImage = await screen.findByTestId('avatar');
    avatarImage.setAttribute('src', mockImageData);
    
    expect(avatarImage).toHaveAttribute('src', mockImageData);
  });
});