// ut-migrate servisinin giriş noktası: `node packages/db/dist/migrate.js`.
// DATABASE_URL zorunludur. Migration klasörü paketin `drizzle/` dizinidir.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runMigrations } from '../migrate'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL tanımlı değil. Açıklama için kökteki .env.example dosyasına bak.')
  process.exit(1)
}

// Kaynaktan (tsx, src/cli) ve derlenmiş hâlden (dist/migrate.js) çalışırken klasörü bul.
const candidates = ['../drizzle', '../../drizzle'].map((p) =>
  fileURLToPath(new URL(p, import.meta.url)),
)
const migrationsFolder = candidates.find((dir) => existsSync(dir))
if (!migrationsFolder) {
  console.error(`Migration klasörü bulunamadı: ${candidates.join(', ')}`)
  process.exit(1)
}

try {
  await runMigrations({
    databaseUrl,
    migrationsFolder,
    log: (message) => console.log(`[migrate] ${message}`),
  })
  process.exit(0)
} catch (error) {
  console.error('[migrate] başarısız:', error instanceof Error ? error.message : error)
  process.exit(1)
}
