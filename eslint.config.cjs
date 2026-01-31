module.exports = [
  {
    files: ['**/*.js', '**/*.vue'],
    parser: 'vue-eslint-parser',
    parserOptions: {
      parser: 'espree',
      ecmaVersion: 2021,
      sourceType: 'module'
    },
    env: {
      browser: true,
      node: true,
      es2021: true
    },
    extends: ['eslint:recommended', 'plugin:vue/vue3-recommended'],
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'vue/no-unused-components': 'warn'
    }
  }
];
