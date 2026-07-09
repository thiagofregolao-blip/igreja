import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

// Porta da API local: lê PORT do .env da raiz (fallback 3000)
function apiPort(): string {
  try {
    const env = fs.readFileSync(path.resolve(__dirname, '../../.env'), 'utf8');
    return env.match(/^PORT=(\d+)/m)?.[1] ?? '3000';
  } catch {
    return '3000';
  }
}
const apiTarget = `http://localhost:${apiPort()}`;

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@catedral/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@catedral/utils': path.resolve(__dirname, '../../packages/utils/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': apiTarget,
      '/uploads': apiTarget,
    },
  },
});
