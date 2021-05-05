module.exports = {
  root: true,
  // allows us to parse the code with babel so that jsx code won't be considered an error
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', '@typescript-eslint', 'jest'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    browser: true,
    es6: true,
    node: true,
    // Allows test files to use jest global functions without confusing eslint into thinking they are undeclared
    'jest/globals': true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-explicit-any': ['off'],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        endOfLine: 'auto',
      },
    ],
  },
  overrides: [
    // Overrides to stop typescript displaying various linting warnings for js files.
    {
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
