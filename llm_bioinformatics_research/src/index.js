/**
 * @file index.js
 * @description Entry point for the React application. It sets up the root render process and wraps the main application
 *              (`App`) with global providers such as `ThemeContextProvider`.
 *
 * Key Features:
 * - Initializes the React application and mounts it to the root DOM element.
 * - Wraps the application with `ThemeContextProvider` to enable global theme management.
 * - Includes `React.StrictMode` to highlight potential issues during development.
 * - Integrates `reportWebVitals` for measuring application performance.
 *
 * Components:
 * - `<App />` - The main application component.
 * - `<ThemeContextProvider>` - Provides theme-related context throughout the app.
 *
 * Dependencies:
 * - `ReactDOM.createRoot` for rendering the application.
 * - Global CSS styles imported from `index.css`.
 * - Performance logging using `reportWebVitals`.
 * 
 * Key Functions:
 * - `ReactDOM.createRoot`: Attaches the app to the DOM element with id `root`.
 * - `reportWebVitals`: Captures and logs performance metrics.
 *
 * Usage:
 * - Modify this file if you need to add global providers or configure app-wide settings.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeContextProvider } from './Context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeContextProvider>
      <App />
    </ThemeContextProvider>
  </React.StrictMode>
);
reportWebVitals();
