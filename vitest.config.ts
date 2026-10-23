import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib'),
      // Redirect SvelteKit virtual modules to static mocks
      '$app/env/private': path.resolve(__dirname, 'tests/__mocks__/app-env-private.ts'),
      '$app/environment': path.resolve(__dirname, 'tests/__mocks__/app-environment.ts')
    }
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    environment: 'node'
  }
});
