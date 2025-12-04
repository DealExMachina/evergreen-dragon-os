import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['../../tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@evergreen/config': resolve(__dirname, '../../packages/config/src'),
      '@evergreen/shared-utils': resolve(__dirname, '../../packages/shared-utils/src'),
      '@evergreen/supabase-client': resolve(__dirname, '../../packages/supabase-client/src'),
      '@evergreen/mem0-client': resolve(__dirname, '../../packages/mem0-client/src'),
      '@evergreen/duckdb-kit': resolve(__dirname, '../../packages/duckdb-kit/src'),
    },
  },
});

