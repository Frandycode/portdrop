import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir:      'dist/webview',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/index.tsx'),
      output: {
        format:         'iife',
        entryFileNames: 'index.js',
        assetFileNames: '[name][extname]',
      },
    },
    minify: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
