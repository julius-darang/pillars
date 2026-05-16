const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  navigator: 'readonly',
  Notification: 'readonly',
  FileReader: 'readonly',
  URL: 'readonly',
  Blob: 'readonly',
  confirm: 'readonly',
  alert: 'readonly',
  console: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  location: 'readonly',
};

export default [
  {
    files: ['utils.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
    },
  },
  {
    files: ['app.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: browserGlobals,
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
    },
  },
];
