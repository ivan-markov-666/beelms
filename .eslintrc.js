module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
  ignorePatterns: ['dist', 'build', 'coverage', 'node_modules'],
  overrides: [
    {
      files: ['tests/**/*.js', 'tests/**/*.ts'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        // Разрешаваме CommonJS require в тестовите файлове
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-commonjs': 'off',
      },
    },
  ],
};
