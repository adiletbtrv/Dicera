import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Discover tests from both src/ (unit) and __tests__/ (integration), never dist/
    include: ['src/**/*.test.ts', '__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    environment: 'node',
    // Isolate each test file so a process.exit in one doesn't bleed into others
    pool: 'forks',
    globals: false,
  },
});
