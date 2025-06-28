import { defineConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite";
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { execSync } from 'child_process';

// Get deployment information at build time
const getDeploymentInfo = () => {
  try {
    const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const buildTime = new Date().toISOString();
    const deployTime = process.env.DEPLOY_TIME || buildTime;
    
    return {
      VITE_GIT_BRANCH: branchName,
      VITE_BUILD_TIME: buildTime,
      VITE_DEPLOY_TIME: deployTime,
    };
  } catch (error) {
    console.warn('Could not get git information:', error.message);
    return {
      VITE_GIT_BRANCH: 'unknown',
      VITE_BUILD_TIME: new Date().toISOString(),
      VITE_DEPLOY_TIME: process.env.DEPLOY_TIME || new Date().toISOString(),
    };
  }
};

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
  plugins: [react(), tailwindcss()],
  base: getBasePath(),
  define: {
    // Inject deployment info as constants
    ...Object.fromEntries(
      Object.entries(getDeploymentInfo()).map(([key, value]) => [
        `import.meta.env.${key}`, 
        JSON.stringify(value)
      ])
    ),
  },
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