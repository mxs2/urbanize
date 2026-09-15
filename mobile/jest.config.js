const path = require("path");

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  rootDir: ".",
  roots: [path.resolve(__dirname, "..", "tests", "unit")],
  testMatch: ["**/*.test.ts"],
  // expo-modules-core fica aninhado em node_modules/expo/node_modules por causa de um
  // conflito de peer dependency com react-native-worklets; jest-expo espera achá-lo na raiz.
  modulePaths: [path.resolve(__dirname, "node_modules"), path.resolve(__dirname, "node_modules/expo/node_modules")],
  setupFiles: [path.resolve(__dirname, "jest.setup.js")],
  moduleNameMapper: {
    "^@/(.*)$": path.resolve(__dirname, "src") + "/$1",
  },
};
