import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    // Playwright owns e2e/*.spec.ts (its own runner). Excluding them here keeps
    // the two test runners from colliding — vitest can't execute Playwright's
    // test.describe()/test() and would otherwise error on every e2e spec.
    exclude: ['node_modules', '.next', 'e2e/**', 'playwright.config.ts'],
  },
});
