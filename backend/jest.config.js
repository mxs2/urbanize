const path = require("path");

/** @type {import('jest').Config} */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  roots: [path.resolve(__dirname, "..", "tests", "acceptance")],
  testMatch: ["**/*.test.ts"],
  modulePaths: [path.resolve(__dirname, "node_modules")],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        isolatedModules: true,
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
        },
      },
    ],
  },
};
