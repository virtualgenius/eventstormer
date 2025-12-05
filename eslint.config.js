import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import sonarjs from 'eslint-plugin-sonarjs'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      sonarjs,
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Complexity rules
      'max-lines-per-function': ['warn', {
        max: 25,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],
      'max-depth': ['warn', { max: 3 }],
      'max-nested-callbacks': ['warn', { max: 2 }],
      'complexity': ['warn', { max: 5 }],
      'sonarjs/cognitive-complexity': ['warn', 10],
    },
  },
  {
    // Relaxed rules for test files
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '*.config.js', '*.config.ts'],
  }
)
