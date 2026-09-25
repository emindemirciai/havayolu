// API'yi tek bir ESM dosyasına paketler. Çalışma zamanı npm bağımlılıkları dışarıda (external) kalır;
// workspace paketleri (@ucus/*) TypeScript kaynaklarından pakete gömülür.
import { readFileSync } from 'node:fs'
import { build } from 'esbuild'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const external = Object.keys(pkg.dependencies ?? {}).filter((name) => !name.startsWith('@ucus/'))

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  external,
  logLevel: 'info',
})
