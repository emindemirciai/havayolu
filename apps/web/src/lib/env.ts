import 'server-only'
import { z } from 'zod'

const ServerEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().trim().optional(),
  API_INTERNAL_URL: z.url().default('http://localhost:4100'),
  GIT_SHA: z.string().min(1).default('dev'),
  BUILD_TIME: z.string().optional(),
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

export const CODE_NAME = 'ucus-takip'

export function appName(env: ServerEnv): string {
  return env.APP_NAME && env.APP_NAME.length > 0 ? env.APP_NAME : CODE_NAME
}
