import { defineConfig } from 'drizzle-kit'

// Yalnızca `drizzle-kit generate` için kullanılır. `push` ve `pull` bu projede kullanılmaz (D-036).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  extensionsFilters: ['postgis'],
  strict: true,
  verbose: true,
})
