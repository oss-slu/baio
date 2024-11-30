/**
 * @file babel.config.js
 * @description Babel configuration for transpiling JavaScript and React code.
 *
 * Purpose:
 * - Transpiles modern JavaScript (ES6+) and JSX code to ensure compatibility with various environments.
 * - Configures Babel to handle React JSX syntax and modern JavaScript features.
 *
 * Key Properties:
 * - `@babel/preset-env`: Transpiles modern JavaScript to be compatible with the target environment.
 * - `@babel/preset-react`: Converts JSX syntax into React-compatible JavaScript.
 *
 * Usage:
 * - This file is used by Babel to configure how code is transpiled before running or bundling.
 * - Ensure this file is present in the root directory when using Babel to transpile your code.
 */

module.exports = {
  presets: [
    "@babel/preset-env", // For ES6+ syntax
    "@babel/preset-react" // For JSX in React components
  ]
};
