import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: fixupConfigRules(compat.extends('@react-native', 'prettier')),
    plugins: { prettier },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
    },
  },
  {
    // `codegenTypes.ts` mirrors React Native's codegen type signatures, which
    // carry type parameters that exist for call-site parity only and are never
    // referenced in the definition.
    files: ['src/codegenTypes.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // The web implementations style DOM elements with CSS objects, which
    // StyleSheet can't hold, and drop the native-only props by destructuring
    // them out of the view props.
    files: ['src/web/**'],
    rules: {
      'react-native/no-inline-styles': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
    },
  },
  {
    // The Jest mock drops the native-only props by destructuring them out of
    // the view props, like the web implementations.
    files: ['src/jest.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['node_modules/', 'lib/', 'coverage/', '**/build/', 'docs/'],
  },
]);
