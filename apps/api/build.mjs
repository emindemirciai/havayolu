// API'yi bağımlılıkları dahil tek bir ESM dosyasına paketler (dist/index.js). Üretim imajı böylece
// node_modules taşımaz. CJS bağımlılıklar (fastify vb.) için `require` banner ile sağlanır.
import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  legalComments: 'linked',
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: 'info',
})
