/**
 * Module: Vitest configuration
 * Purpose: Run fast unit tests for browser-safe project helpers without provider credentials
 * Used by: npm test
 * Dependencies: Vitest, Vite configuration runtime
 * Public functions: None; configuration export
 * Side effects: Discovers and executes source unit-test files in Node environment
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
