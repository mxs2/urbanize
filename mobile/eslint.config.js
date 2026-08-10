const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/**", ".expo/**", "dist/**", "jest.config.js", "jest.setup.js", "babel.config.js"],
  },
];
