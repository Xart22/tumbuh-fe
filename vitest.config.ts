import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // `lib/*.test.ts` stays on node:test; vitest owns *.vitest.spec.* only.
    include: ['**/*.vitest.spec.{ts,tsx}'],
  },
});
