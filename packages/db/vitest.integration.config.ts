import { defineConfig } from 'vitest/config'

// Gerçek PostgreSQL gerektirir: yerelde `docker compose -f docker-compose.dev.yml up -d --wait`,
// CI'da servis konteyneri. Bağlantı TEST_DATABASE_ADMIN_URL'den gelir.
export default defineConfig({
  test: {
    include: ['src/**/*.int.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
})
