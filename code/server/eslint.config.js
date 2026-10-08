import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next|res|req' }],
      'no-console': 'off'
    }
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/']
  }
];
