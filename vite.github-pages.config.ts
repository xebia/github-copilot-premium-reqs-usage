import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

// Simple Vite config for GitHub Pages deployment
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
    // Set external dependencies that shouldn't be bundled
    rollupOptions: {
      external: ['@github/spark/spark']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  base: './' // Set base for GitHub Pages
});