module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.base.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
  },

  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],

  env: {
    browser: true,
    node: true,
    jest: true,
  },
  overrides: [
     {
       files: ['apps/{admin,web}/**/*.{ts,tsx}'],
       plugins: ['react', 'react-hooks'],
       extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
       settings: { react: { version: 'detect' } },
     },
    {
      files: ['apps/backend/**/*.ts'],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./apps/backend/tsconfig.json'],
      },
      extends: ['plugin:@typescript-eslint/recommended-requiring-type-checking'],
    },
  ],
};
