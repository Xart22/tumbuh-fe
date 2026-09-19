import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// `.mts`, not `.ts`: package.json has no `"type": "module"`, so a `.ts` config is
// loaded as CommonJS and its ESM syntax silently fails to load.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // `lib/*.test.ts` stays on node:test; vitest owns *.vitest.spec.* only.
    include: ['**/*.vitest.spec.{ts,tsx}'],
  },
});
