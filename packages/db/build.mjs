// hy-migrate için tek dosyalık, bağımlılıkları gömülü bir çalıştırılabilir üretir: dist/migrate.js.
// Migration SQL'leri çalışma zamanında paketin drizzle/ klasöründen okunur.
import { build } from 'esbuild'

await build({
  entryPoints: ['src/cli/migrate.ts'],
  outfile: 'dist/migrate.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: 'info',
})
