// @ts-check
// Flat config built on @nuxt/eslint's project-aware preset (for Nuxt
// auto-import globals). Formatting is owned by Prettier (stylistic off).
import './scripts/node-compat.mjs'
import withNuxt from './.nuxt/eslint.config.mjs'
import { parser as tsParser } from 'typescript-eslint'

export default withNuxt(
  {
    // Force TypeScript parsing for <script lang="ts"> in SFCs.
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        sourceType: 'module',
      },
    },
  },
  {
    rules: {
      // Pages, layouts and single-purpose components are intentionally single-word.
      'vue/multi-word-component-names': 'off',
      // TS already expresses optionality on props; defaults aren't required.
      'vue/require-default-prop': 'off',
    },
  },
  {
    // Nitro server routes/handlers: parse as TypeScript and register the
    // runtime auto-imports (h3 utilities, $fetch, useRuntimeConfig) as globals.
    files: ['server/**/*.{ts,mts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
      globals: {
        defineEventHandler: 'readonly',
        defineNitroPlugin: 'readonly',
        setHeader: 'readonly',
        getQuery: 'readonly',
        useRuntimeConfig: 'readonly',
        $fetch: 'readonly',
      },
    },
  }
)
