const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-markdown$": "<rootDir>/test/__mocks__/react-markdown.tsx",
    "^remark-gfm$": "<rootDir>/test/__mocks__/remark-gfm.ts",
    "^rehype-raw$": "<rootDir>/test/__mocks__/rehype-raw.ts",
    "^rehype-sanitize$": "<rootDir>/test/__mocks__/rehype-sanitize.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "/node_modules/(?!(react-markdown|vfile|unist-.*|unified|bail|is-plain-obj|trough|remark-.*|mdast-util-.*|micromark.*|rehype-sanitize|hast-util-.*|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|ccount|escape-string-regexp|markdown-table|trim-lines)/)",
    "\\\\node_modules\\\\(?!(react-markdown|vfile|unist-.*|unified|bail|is-plain-obj|trough|remark-.*|mdast-util-.*|micromark.*|rehype-sanitize|hast-util-.*|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|ccount|escape-string-regexp|markdown-table|trim-lines)(\\\\|$))",
  ],
};

module.exports = createJestConfig(customJestConfig);
