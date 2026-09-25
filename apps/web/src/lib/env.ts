import 'server-only'
import { withoutEnvPlaceholders } from '@havayolu/shared'
import { z } from 'zod'

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const ServerEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  API_INTERNAL_URL: z.preprocess(emptyToUndefined, z.url().default('http://localhost:4100')),
  // İmaja build sırasında gömülür ve Dokploy'a girilmez; boş gelirse açılışı engellemez, 'dev' olur.
  GIT_SHA: z.preprocess(emptyToUndefined, z.string().min(1).default('dev')),
  BUILD_TIME: z.preprocess(emptyToUndefined, z.string().optional()),
  ADMIN_HOST: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  ANALYZE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  ANALYZE_SITE_ID: z.preprocess(emptyToUndefined, z.string().trim().optional()),
})

export type ServerEnv = z.infer<typeof ServerEnvSchema>

/** Sunucu tarafı yapılandırması; çalışma zamanında okunur (build'e gömülmez). */
export function getServerEnv(): ServerEnv {
  // Şablondaki "#…#" talimatları tanımsız sayılır (D-063).
  const result = ServerEnvSchema.safeParse(withoutEnvPlaceholders(process.env))
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
  if (!env.ANALYZE_URL || !env.ANALYZE_SITE_ID) return null
  return {
    trackerUrl: new URL('/api/tracker', env.ANALYZE_URL).toString(),
    siteId: env.ANALYZE_SITE_ID,
  }
}
