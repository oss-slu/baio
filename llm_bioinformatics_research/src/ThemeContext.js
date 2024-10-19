import React, { createContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const ThemeContextProvider = ({ children }) => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [themeMode, setThemeMode] = useState(prefersDarkMode ? 'dark' : 'light');

    const toggleTheme = (mode) => {
        if (mode === 'light' || mode === 'dark') {
            setThemeMode(mode);
        } else {
            setThemeMode(prefersDarkMode ? 'dark' : 'light');
        }
    };

    const theme = useMemo(() => createTheme({
        palette: {
            mode: themeMode,
        },
    }), [themeMode]);

    useEffect(() => {
        document.body.className = themeMode === 'light' ? 'light-theme' : 'dark-theme';
    }, [themeMode]);

    return (
        <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
