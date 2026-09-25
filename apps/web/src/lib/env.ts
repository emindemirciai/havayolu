import 'server-only'
import { z } from 'zod'

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const ServerEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  API_INTERNAL_URL: z.preprocess(emptyToUndefined, z.url().default('http://localhost:4100')),
  GIT_SHA: z.string().min(1).default('dev'),
  BUILD_TIME: z.preprocess(emptyToUndefined, z.string().optional()),
  ADMIN_HOST: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  ANALYTICS_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  ANALYTICS_SITE_ID: z.preprocess(emptyToUndefined, z.string().trim().optional()),
})

export type ServerEnv = z.infer<typeof ServerEnvSchema>

/** Sunucu tarafı yapılandırması; çalışma zamanında okunur (build'e gömülmez). */
export function getServerEnv(): ServerEnv {
  const result = ServerEnvSchema.safeParse(process.env)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(
      `Web ortam değişkenleri hatalı: ${issues}. Açıklamalar için .env.example dosyasına bak.`,
    )
  }
  return result.data
}

/** Marka adı (D-059). APP_NAME ile değiştirilebilir. */
export const DEFAULT_APP_NAME = 'havayolu'

export function appName(env: ServerEnv): string {
  return env.APP_NAME && env.APP_NAME.length > 0 ? env.APP_NAME : DEFAULT_APP_NAME
}

/** Analiz takip script'i yalnızca adres ve site kimliği birlikte tanımlıysa kullanılabilir. */
export function analyticsConfig(env: ServerEnv): { trackerUrl: string; siteId: string } | null {
  if (!env.ANALYTICS_URL || !env.ANALYTICS_SITE_ID) return null
  return {
    trackerUrl: new URL('/api/tracker', env.ANALYTICS_URL).toString(),
    siteId: env.ANALYTICS_SITE_ID,
  }
}
