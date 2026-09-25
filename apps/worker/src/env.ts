import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { withoutEnvPlaceholders } from '@havayolu/shared'
import { z } from 'zod'

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const EnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  // İmaja build sırasında gömülür ve Dokploy'a girilmez; boş gelirse açılışı engellemez, 'dev' olur.
  GIT_SHA: z.preprocess(emptyToUndefined, z.string().min(1).default('dev')),
  WORKER_ROLE: z.preprocess(emptyToUndefined, z.string().default('all')),
  /** Admin panelinde görünen servis adı; üretimde worker-rt ya da worker-bg. */
  WORKER_SERVICE_NAME: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^[a-z0-9-]+$/, 'yalnızca küçük harf, rakam ve tire')
      .default('worker-dev'),
  ),
  WORKER_HEALTH_PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(65535).default(4200),
  ),
  REDIS_QUEUE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
})

export type Env = z.infer<typeof EnvSchema>

export class EnvError extends Error {
  constructor(issues: string[]) {
    super(
      `Ortam değişkenleri hatalı:\n${issues.map((i) => `  - ${i}`).join('\n')}\nAçıklamalar için kökteki .env.example dosyasına bak.`,
    )
    this.name = 'EnvError'
  }
}

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  // Şablondaki "#…#" talimatları tanımsız sayılır (D-063).
  const result = EnvSchema.safeParse(withoutEnvPlaceholders(source))
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((i) => `${i.path.join('.') || '(kök)'}: ${i.message}`),
    )
  }
  if (result.data.APP_ENV === 'production' && !result.data.REDIS_QUEUE_URL) {
    throw new EnvError(['REDIS_QUEUE_URL: üretimde zorunlu'])
  }
  return result.data
}

/** Geliştirmede kökteki .env (varsa) ve .env.example'ı yükler; üretimde hiçbir şey yüklemez. */
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
