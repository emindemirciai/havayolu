// Üretim compose'u için kural denetimi (infra.md → Compose kuralları). Docker gerektirir.
// - Hiçbir serviste `build:` yok (imajlar GHCR'dan çekilir).
// - Uygulama imajları ghcr.io/emindemirciai/havayolu-* ve pull_policy: always.
// - Her serviste bellek limiti ve log rotasyonu var; hiçbir servis host portu yayınlamıyor.
// - Servis adları `ut-` önekli.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

interface ComposeService {
  image?: string
  build?: unknown
  pull_policy?: string
  mem_limit?: string | number
  ports?: unknown[]
  logging?: { driver?: string; options?: Record<string, string> }
}

const output = execFileSync(
  'docker',
  [
    'compose',
    '-f',
    'docker-compose.yml',
    '--env-file',
    '.env.example',
    'config',
    '--format',
    'json',
  ],
  { cwd: root, encoding: 'utf8' },
)
const config = JSON.parse(output) as { services: Record<string, ComposeService> }
const problems: string[] = []

for (const [name, service] of Object.entries(config.services)) {
  if (!name.startsWith('hy-')) problems.push(`${name}: servis adı "hy-" önekiyle başlamalı`)
  if (service.build) problems.push(`${name}: üretim compose'unda build: olamaz`)
  if (!service.mem_limit) problems.push(`${name}: mem_limit yok`)
  if (service.ports && service.ports.length > 0)
    problems.push(`${name}: host portu yayınlanamaz (expose kullan)`)
  if (service.logging?.options?.['max-size'] !== '10m')
    problems.push(`${name}: log rotasyonu (max-size 10m) yok`)
  const image = service.image ?? ''
  if (image.startsWith('ghcr.io/')) {
    if (image !== image.toLowerCase()) problems.push(`${name}: GHCR imaj adı küçük harfli olmalı`)
    if (!/^ghcr\.io\/emindemirciai\/havayolu-(web|api|worker):/.test(image)) {
      problems.push(`${name}: beklenmeyen imaj ${image}`)
    }
    if (service.pull_policy !== 'always') problems.push(`${name}: pull_policy always olmalı`)
  }
}

if (problems.length > 0) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'))
  process.exit(1)
}
console.log(`✓ Compose kuralları tamam (${Object.keys(config.services).length} servis).`)
