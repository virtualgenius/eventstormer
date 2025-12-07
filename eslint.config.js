import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import sonarjs from 'eslint-plugin-sonarjs'

// Custom rule: require named functions for timing workarounds
const requireNamedTimingWorkaround = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require named functions for setTimeout(fn, 0) and requestAnimationFrame workarounds',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check setTimeout(..., 0)
        if (
          node.callee.name === 'setTimeout' &&
          node.arguments.length >= 2 &&
          node.arguments[1].type === 'Literal' &&
          node.arguments[1].value === 0
        ) {
          const callback = node.arguments[0]
          if (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') {
            context.report({
              node,
              message: 'setTimeout(..., 0) should use a named function explaining WHY the defer is needed',
            })
          }
        }
        // Check requestAnimationFrame
        if (node.callee.name === 'requestAnimationFrame') {
          const callback = node.arguments[0]
          if (callback && (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression')) {
            context.report({
              node,
              message: 'requestAnimationFrame should use a named function explaining WHY the defer is needed',
            })
          }
        }
      },
    }
  },
}

// Custom plugin for project-specific clarity rules
const clarityPlugin = {
  rules: {
    'require-named-timing-workaround': requireNamedTimingWorkaround,
  },
}

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      sonarjs,
      clarity: clarityPlugin,
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

      // Magic numbers
      'no-magic-numbers': ['warn', {
        ignore: [0, 1, -1, 2],
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
        detectObjects: false,
      }],

      // Custom clarity rules
      'clarity/require-named-timing-workaround': 'warn',
    },
  },
  {
    // Relaxed rules for test files
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**', '**/tests/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      'no-magic-numbers': 'off',
    },
  },
  {
    // Relaxed line limits for React hooks
    files: ['**/use*.ts', '**/use*.tsx'],
    rules: {
      'max-lines-per-function': ['warn', {
        max: 75,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],
    },
  },
  {
    // React components need more lines for JSX templates
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': ['warn', {
        max: 150,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],
    },
  },
  {
    // Workers have separate tsconfig, skip eslint type checking
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'workers/**', '*.config.js', '*.config.ts'],
  }
)
