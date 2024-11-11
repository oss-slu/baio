// jest.config.js
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
  