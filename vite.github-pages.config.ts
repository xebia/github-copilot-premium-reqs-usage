import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
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

// Simple Vite config for GitHub Pages deployment
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
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