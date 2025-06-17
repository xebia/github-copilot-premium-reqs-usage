import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// Get the GitHub repository name from package.json to use as base path
// This makes assets load correctly on GitHub Pages
const getBasePath = () => {
  try {
    // Only apply base path when building for production, not in development
    if (process.env.NODE_ENV === 'production') {
      // Extract repo name from homepage or use github-copilot-usage as default
      const pkgJson = require('./package.json');
      const homepagePath = pkgJson.homepage;
      if (homepagePath) {
        const pathMatch = homepagePath.match(/\/([^/]+)\/?$/);
        if (pathMatch) return `/${pathMatch[1]}/`;
      }
      return '/github-copilot-usage/'; // Default repo name
    }
    return '/'; // Default for dev
  } catch (e) {
    return '/'; // Fallback
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: getBasePath(),
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      external: ['@github/spark/spark']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});