import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'

const EnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_LISTEN_HOST: z.string().min(1).default('0.0.0.0'),
  API_PORT: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().int().min(1).max(65535).optional(),
  ),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  GIT_SHA: z.string().min(1).default('dev'),
  BUILD_TIME: z.string().optional(),
})

/** Konteyner içi üretim portu 4000; yerel geliştirmede 4100 (3000–3003 bu makinede dolu). */
export const DEFAULT_API_PORT = { production: 4000, local: 4100 } as const

export type Env = Omit<z.infer<typeof EnvSchema>, 'API_PORT'> & { API_PORT: number }

export class EnvError extends Error {
  constructor(issues: string[]) {
    super(
      `Ortam değişkenleri hatalı:\n${issues.map((i) => `  - ${i}`).join('\n')}\nAçıklamalar için kökteki .env.example dosyasına bak.`,
    )
    this.name = 'EnvError'
  }
}

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = EnvSchema.safeParse(source)
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((i) => `${i.path.join('.') || '(kök)'}: ${i.message}`),
    )
  }
  const data = result.data
  const fallbackPort =
    data.APP_ENV === 'production' ? DEFAULT_API_PORT.production : DEFAULT_API_PORT.local
  return { ...data, API_PORT: data.API_PORT ?? fallbackPort }
}

/**
 * Geliştirmede repo kökündeki env dosyalarını yükler: önce kullanıcının .env'i (varsa), sonra
 * .env.example (sır olmayan geliştirme varsayılanları). Önce yüklenen kazanır; zaten tanımlı
 * değişkenler ezilmez. Üretimde env'i Dokploy sağlar ve bu fonksiyon hiçbir şey yüklemez.
 */
export function loadDotEnvForDevelopment(startDir: string = process.cwd()): string[] {
  if (process.env.APP_ENV === 'production') return []
  let dir = startDir
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      const loaded: string[] = []
      for (const name of ['.env', '.env.example']) {
        const file = join(dir, name)
        if (existsSync(file)) {
          process.loadEnvFile(file)
          loaded.push(file)
        }
      }
      return loaded
    }
    const parent = dirname(dir)
    if (parent === dir) return []
    dir = parent
  }
}
