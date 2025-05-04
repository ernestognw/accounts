import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { includeIgnoreFile } from '@eslint/compat';
import { defineConfig } from 'eslint/config';
import { fileURLToPath } from 'node:url';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  includeIgnoreFile(gitignorePath),
  { files: ['**/*.{js,mjs,cjs,ts}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  { files: ['**/*.{js,mjs,cjs,ts}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  tseslint.configs.recommended,
]);
