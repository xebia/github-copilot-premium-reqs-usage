import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})