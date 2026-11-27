import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('\\react\\') ||
              id.includes('/react-dom/') ||
              id.includes('\\react-dom\\') ||
              id.includes('/scheduler/') ||
              id.includes('\\scheduler\\')
            ) {
              return 'react';
            }
            if (
              id.includes('/gsap/') ||
              id.includes('\\gsap\\') ||
              id.includes('/lenis/') ||
              id.includes('\\lenis\\')
            ) {
              return 'motion';
            }
          }
          if (
            id.includes('src/data/atelierContent') ||
            id.includes('src\\data\\atelierContent') ||
            id.includes('src/engines/aiTwinEngine') ||
            id.includes('src\\engines\\aiTwinEngine')
          ) {
            return 'data';
          }
          return undefined;
        },
      },
    },
  },
});
