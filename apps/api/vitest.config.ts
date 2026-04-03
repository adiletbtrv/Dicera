import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', '__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    environment: 'node',
    pool: 'forks',
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/db/seed.ts', 'src/db/migrate.ts', 'src/db/fix.ts', 'src/server.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});
