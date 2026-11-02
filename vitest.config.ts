import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// PWA などビルド専用のプラグインを読み込まないよう、vite.config.ts とは分けている
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/shared/lib/**', 'src/stores/**'],
      exclude: ['src/**/*.test.{ts,tsx}'],
      // testing.md: lib は行カバレッジ 80% 以上
      thresholds: { 'src/shared/lib/**': { lines: 80 }, 'src/stores/**': { lines: 70 } },
    },
  },
});
