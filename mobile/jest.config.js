const path = require("path");

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  rootDir: ".",
  roots: [path.resolve(__dirname, "..", "tests", "unit")],
  testMatch: ["**/*.test.ts"],
  modulePaths: [path.resolve(__dirname, "node_modules")],
  setupFiles: [path.resolve(__dirname, "jest.setup.js")],
  moduleNameMapper: {
    "^@/(.*)$": path.resolve(__dirname, "src") + "/$1",
  },
};
