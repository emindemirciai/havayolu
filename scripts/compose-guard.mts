// Üretim compose'u için kural denetimi (infra.md → Compose kuralları). Docker gerektirir.
// - Hiçbir serviste `build:` yok (imajlar GHCR'dan çekilir).
// - Uygulama imajları ghcr.io/emindemirciai/havayolu-* ve pull_policy: always.
// - Her serviste bellek limiti ve log rotasyonu var; hiçbir servis host portu yayınlamıyor.
// - Servis adları `hy-` önekli.
// Üretim env şablonu (deploy/dokploy.env.example, D-060) için de:
// - Compose'un okuduğu her ${DEĞİŞKEN} şablonda var; şablondaki her anahtar .env.example'da açıklanmış.
// - Compose'un kendisinin verdiği ya da imaja gömülen anahtarlar şablonda yok.
// - Sır değerleri boş; yerel değerler (_dev_only, localhost) yok.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

/** KEY=değer satırlarını okur (yorum ve boş satırlar atlanır). */
function readEnvFile(path: string): Map<string, string> {
  const entries = new Map<string, string>()
  for (const line of readFileSync(join(root, path), 'utf8').split('\n')) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line.trim())
    if (match?.[1] !== undefined) entries.set(match[1], match[2] ?? '')
  }
  return entries
}

/** Compose'un kendisinin verdiği ya da imaja build sırasında gömülen değişkenler. */
const COMPOSE_OWNED = [
  'APP_ENV',
  'DATABASE_URL',
  'REDIS_QUEUE_URL',
  'REDIS_LIVE_URL',
  'API_INTERNAL_URL',
  'WEB_INTERNAL_URL',
  'API_PORT',
  'WORKER_ROLE',
  'WORKER_SERVICE_NAME',
  'EXPECTED_WORKERS',
  'GIT_SHA',
  'BUILD_TIME',
]
const SECRET_KEY =
  /(PASSWORD|SECRET|SECRET_KEY|SECRET_ACCESS_KEY|TOKEN|PRIVATE_KEY|SIGNING_KEY|ACCESS_KEY_ID|API_KEY|DSN|SMTP_URL)$/

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

const TEMPLATE = 'deploy/dokploy.env.example'
const template = readEnvFile(TEMPLATE)
const documented = readEnvFile('.env.example')
// "$${X}" compose kaçışıdır (konteyner içindeki kabuk değişkeni); interpolasyon değildir.
const composeText = readFileSync(join(root, 'docker-compose.yml'), 'utf8')
const interpolated = new Set(
  [...composeText.matchAll(/(?<!\$)\$\{([A-Z][A-Z0-9_]*)/g)].map((m) => m[1] ?? ''),
)
for (const key of interpolated) {
  if (!template.has(key))
    problems.push(`${TEMPLATE}: compose ${key} değişkenini okuyor ama şablonda yok`)
}
for (const [key, value] of template) {
  if (!documented.has(key)) problems.push(`${TEMPLATE}: ${key} .env.example'da açıklanmamış`)
  if (COMPOSE_OWNED.includes(key)) {
    problems.push(`${TEMPLATE}: ${key} compose ya da imaj tarafından verilir; şablona yazılmaz`)
  }
  if (SECRET_KEY.test(key) && value !== '') {
    problems.push(`${TEMPLATE}: ${key} bir sır; şablonda değeri boş olmalı`)
  }
  if (/_dev_only|localhost|127\.0\.0\.1/.test(value)) {
    problems.push(`${TEMPLATE}: ${key} yerel geliştirme değeri içeriyor`)
  }
}

if (problems.length > 0) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'))
  process.exit(1)
}
console.log(
  `✓ Compose kuralları tamam (${Object.keys(config.services).length} servis); üretim env şablonu ${template.size} anahtar.`,
)
