import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import UserProfileMenu from '../UserProfile/UserProfileMenu';
import { BrowserRouter as Router } from 'react-router-dom';
import ThemeContext from '../ThemeContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const mockToggleTheme = jest.fn();

const renderComponent = () => {
    return render(
        <ThemeContext.Provider value={{ toggleTheme: mockToggleTheme }}>
            <Router>
                <UserProfileMenu />
            </Router>
        </ThemeContext.Provider>
    );
};

beforeAll(() => {
    window.alert = jest.fn();
});

describe('UserProfileMenu', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('renders user profile menu button', () => {
        renderComponent();
        const button = screen.getByLabelText('user profile menu');
        expect(button).toBeInTheDocument();
    });

    test('opens menu when button is clicked', () => {
        renderComponent();
        const button = screen.getByLabelText('user profile menu');
        fireEvent.click(button);
        const menu = screen.getByRole('menu');
        expect(menu).toBeInTheDocument();
    });

    test('displays user information from localStorage', () => {
        const userData = {
            username: 'John Doe',
            profile_photo: 'profile.jpg',
            theme: 'light',
            language: 'en',
        };
        localStorage.setItem('userData', JSON.stringify(userData));

        renderComponent();
        const button = screen.getByLabelText('user profile menu');
        fireEvent.click(button);

        const userName = screen.getByText(userData.username);
        const userImage = screen.getByAltText('User Profile');

        expect(userName).toBeInTheDocument();
        expect(userImage).toHaveAttribute('src', userData.profile_photo);
    });

    test('navigates to profile page when "My Profile" is clicked', () => {
        renderComponent();
        const button = screen.getByLabelText('user profile menu');
        fireEvent.click(button);

        const profileMenuItem = screen.getByText('My Profile');
        fireEvent.click(profileMenuItem);

        expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    test('toggles settings menu when "Settings" is clicked', () => {
        renderComponent();
        const button = screen.getByLabelText('user profile menu');
        fireEvent.click(button);

        const settingsMenuItem = screen.getByText('Settings');
        fireEvent.click(settingsMenuItem);

        const themeSelect = screen.getByText('Theme');
        const languageSelect = screen.getByText('Language');

        expect(themeSelect).toBeInTheDocument();
        expect(languageSelect).toBeInTheDocument();
    });

    test('logs out user when "Log Out" is clicked', () => {
        renderComponent();
      
        const profileButton = screen.getByLabelText('user profile menu');
        fireEvent.click(profileButton);
      
        const logoutMenuItem = screen.getByText('Log Out');
        fireEvent.click(logoutMenuItem);
      
        const confirmDialog = screen.getByRole('dialog', { name: /confirm logout/i });
        expect(confirmDialog).toBeInTheDocument();
      
        const confirmLogoutButton = screen.getByRole('button', { name: /logout/i });
        fireEvent.click(confirmLogoutButton);
      
      });

    test('updates theme when theme is changed', async () => {
        renderComponent();
        const button = screen.getByLabelText('user profile menu');
        fireEvent.click(button);
    
        const settingsMenuItem = screen.getByText('Settings');
        fireEvent.click(settingsMenuItem);
    
        const themeSelect = screen.getByLabelText('Theme');
        fireEvent.mouseDown(themeSelect); 
    
        const darkOption = await screen.findByText('Dark');
        fireEvent.click(darkOption); 
    
        await waitFor(() => {
          expect(mockToggleTheme).toHaveBeenCalledWith('dark'); 
        });
    
        expect(themeSelect).toHaveTextContent('Dark');
      });
});