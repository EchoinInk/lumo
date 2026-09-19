const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["scripts/**/*.js", "*.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];
