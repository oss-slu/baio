import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import UserProfile from '../UserProfile/UserProfile';
import ThemeContext from '../ThemeContext';

describe('UserProfile Component with Theme Testing', () => {
  const renderWithThemeContext = (ui, { theme = 'light', toggleTheme } = {}) => {
    return render(
      <MemoryRouter>
        <ThemeContext.Provider value={{ themeMode: theme, toggleTheme }}>
          {ui}
        </ThemeContext.Provider>
      </MemoryRouter>
    );
  };

  test('switches to settings page when settings button is clicked', () => {
    const toggleTheme = jest.fn();
    renderWithThemeContext(<UserProfile />, { theme: 'light', toggleTheme });

    const settingsButton = screen.getByText(/Settings/i);
    fireEvent.click(settingsButton);
    expect(screen.getByText(/System Default/i)).toBeInTheDocument();
  });


  test('renders UserProfile with light theme by default', () => {
    const toggleTheme = jest.fn();
    renderWithThemeContext(<UserProfile />, { theme: 'light', toggleTheme });

    const myProfileButton = screen.getByText(/My Profile/i);
    const settingsButton = screen.getByText(/Settings/i);

    // Check that colors are set correctly for light theme
    expect(myProfileButton).toHaveStyle('color: white');
    expect(settingsButton).toHaveStyle('color: black');
  });

  test('changes button colors when dark theme is set', () => {
    const toggleTheme = jest.fn();
    renderWithThemeContext(<UserProfile />, { theme: 'dark', toggleTheme });

    const myProfileButton = screen.getByText(/My Profile/i);
    const settingsButton = screen.getByText(/Settings/i);

    // Check that colors are set correctly for dark theme
    expect(myProfileButton).toHaveStyle('color: white');
    expect(settingsButton).toHaveStyle('color: white');
  });

});
