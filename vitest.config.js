import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      // Use .env.test file
    },
    envFile: '.env.test',
    fileParallelism: false, // Ensure test isolation with sequential test file execution
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'generated/',
        'prisma/',
        '*.config.js',
        'tests/'
      ]
    },
    setupFiles: ['./tests/setup.js']
  }
})
