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
      // SDK 58's ESLint preset enables React Compiler rules. Lumo does not yet
      // use the compiler, so preserve the pre-upgrade lint contract here.
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/use-memo": "off",
    },
  },
];
