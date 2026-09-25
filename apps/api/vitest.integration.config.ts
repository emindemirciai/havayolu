import { defineConfig } from 'vitest/config'

// Gerçek PostgreSQL ve iki Redis gerektirir: yerelde docker-compose.dev.yml, CI'da servis konteynerleri.
export default defineConfig({
  test: {
    include: ['src/**/*.int.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
