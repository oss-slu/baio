/**
 * @file jest.config.js
 * @description Jest configuration for testing JavaScript and React applications.
 *
 * Purpose:
 * - Configures Jest to use `babel-jest` for transforming JavaScript and TypeScript files.
 * - Ensures compatibility with modern ES modules in `node_modules` (e.g., `axios`, `@mui`).
 * - Sets up the testing environment to simulate a browser-like environment using `jsdom`, suitable for React component testing.
 *
 * Key Properties:
 * - `transform`: Uses `babel-jest` to transpile `.js`, `.jsx`, `.ts`, and `.tsx` files, ensuring compatibility with modern JavaScript/TypeScript syntax.
 * - `transformIgnorePatterns`: Prevents Jest from ignoring ES modules in certain packages (`axios`, `@mui`, etc.), allowing them to be processed by Jest.
 * - `moduleNameMapper`: Resolves the `axios` module correctly in Jest, ensuring it works as expected in tests.
 * - `testEnvironment`: Configures Jest to use `jsdom`, which mimics the browser environment for testing React components.
 *
 * Usage:
 * - This configuration is automatically applied when running Jest tests.
 * - No additional setup is needed as long as this file is placed in the root directory of the project.
 *
 * Dependencies:
 * - `babel-jest`: Transpiles code using Babel during testing.
 * - `axios`, `@mui`: Ensures compatibility of specific ES modules during testing.
 * - `jsdom`: Provides a simulated browser environment for React testing.
 */

module.exports = {
    transform: {
      "^.+\\.[tj]sx?$": "babel-jest", // Transforms JavaScript and TypeScript files with babel-jest
    },
    transformIgnorePatterns: [
      "node_modules/(?!(axios|@mui|other-esm-module)/)" // Ensures Jest processes these ES modules
    ],
    moduleNameMapper: {
      "^axios$": require.resolve("axios") // Resolves axios module correctly in Jest
    },
    testEnvironment: "jsdom" // Makes sure Jest uses the jsdom environment for React components
  };
  