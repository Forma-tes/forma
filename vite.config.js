import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  esbuild: { jsx: 'automatic' },
  build: {
    rollupOptions: {
      // The app, plus the design-system reference page at /design-system.html
      input: { main: resolve(__dirname, 'index.html'), designSystem: resolve(__dirname, 'design-system.html') },
    },
  },
});
