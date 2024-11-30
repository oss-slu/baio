/**
 * @file setuptests.js
 * @description Configuration file for setting up Jest testing environment for the application.
 *
 * Purpose:
 * - Enhances Jest with custom matchers provided by `@testing-library/jest-dom` for asserting DOM nodes.
 * - Mocks browser-specific APIs (e.g., `window.matchMedia`) to ensure compatibility in the testing environment.
 *
 * Key Features:
 * - Imports `@testing-library/jest-dom` to add custom matchers, such as `toHaveTextContent`.
 * - Mocks `window.matchMedia` to simulate user preferences for media queries (e.g., dark mode testing).
 *
 * Usage:
 * - Automatically executed by Jest before running tests.
 * - Add additional mocks or global setup logic as needed for tests.
 * 
 * Resources:
 * - Jest DOM: https://github.com/testing-library/jest-dom
 * - Jest Docs: https://jestjs.io/docs/configuration
 *
 */

import '@testing-library/jest-dom';

const mockMatchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: query === '(prefers-color-scheme: dark)', // Default to dark mode
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: mockMatchMedia,
});
