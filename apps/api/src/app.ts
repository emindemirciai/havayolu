import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import { currentVersion } from '@ucus/shared'
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify'
import type { Redis } from 'ioredis'
import { collectServices, type ServiceProbes } from './admin/services'
import { registerAuthRoutes, requireAdmin } from './auth/routes'
import type { SessionStore } from './auth/session-store'
import type { Env } from './env'

export interface VersionInfo {
  app: 'ucus-takip'
  version: string
  gitSha: string
  buildTime: string | null
  env: Env['APP_ENV']
}

export interface AppDeps {
  /** `null`: oturum deposu yok (redis-queue tanımsız) → yönetici girişi kapalı. */
  sessionStore: SessionStore | null
  /** /ready kontrolleri; `null` = yapılandırılmamış (üretimde env doğrulaması bunu engeller). */
  readiness: Record<string, (() => Promise<number>) | null>
  probes: Omit<ServiceProbes, 'api'>
  /** Hız limiti sayaçları için redis-queue; yoksa süreç içi sayaç kullanılır. */
  rateLimitRedis: Redis | null
}

/** CORS izinli origin'leri: web ve admin host'ları (yerelde http, diğerlerinde https). */
export function allowedOrigins(env: Env): string[] {
  const hosts = [env.WEB_HOST, env.ADMIN_HOST].filter((h): h is string => Boolean(h))
  return hosts.map((host) =>
    host.startsWith('localhost') || host.startsWith('127.0.0.1')
      ? `http://${host}`
      : `https://${host}`,
  )
}

/** İstemci IP'si: Cloudflare modunda ve istek güvenilen proxy'den geldiyse CF-Connecting-IP. */
export function clientIp(env: Env, request: FastifyRequest): string {
  const cfIp = request.headers['cf-connecting-ip']
  if (
    env.EDGE_PROXY === 'cloudflare' &&
    env.TRUSTED_PROXY_CIDRS.length > 0 &&
    typeof cfIp === 'string'
  ) {
    return cfIp
  }
  return request.ip
}

const UNAUTHORIZED = { message: 'Yönetici oturumu gerekli.' }

export async function buildApp(env: Env, deps: AppDeps): Promise<FastifyInstance> {
  const startedAt = new Date()
  const app = Fastify({
    logger:
      env.LOG_LEVEL === 'silent'
        ? false
        : {
            level: env.LOG_LEVEL,
            redact: ['req.headers.authorization', 'req.headers.cookie', '*.token', '*.password'],
          },
    trustProxy: env.TRUSTED_PROXY_CIDRS.length > 0 ? env.TRUSTED_PROXY_CIDRS : false,
  })

  await app.register(helmet, { global: true })
  const origins = allowedOrigins(env)
  await app.register(cors, { origin: origins.length > 0 ? origins : false, credentials: true })
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    keyGenerator: (request) => clientIp(env, request),
    ...(deps.rateLimitRedis ? { redis: deps.rateLimitRedis, nameSpace: 'ut:ratelimit:' } : {}),
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      message: `Çok fazla istek. ${Math.ceil(context.ttl / 1000)} sn sonra yeniden dene.`,
    }),
  })
  await app.register(swagger, {
    openapi: {
      info: { title: 'ucus-takip API', version: currentVersion() },
      tags: [
        { name: 'system', description: 'Sağlık ve sürüm' },
        { name: 'auth', description: 'Yönetici oturumu (platform-admin sözleşmesi)' },
        { name: 'admin', description: 'Yönetim' },
      ],
    },
  })

  const versionInfo: VersionInfo = {
    app: 'ucus-takip',
    version: currentVersion(),
    gitSha: env.GIT_SHA,
    buildTime: env.BUILD_TIME ?? null,
    env: env.APP_ENV,
  }

  // Canlılık: süreç ayakta ve istek kabul ediyor mu.
  app.get('/health', { schema: { tags: ['system'] } }, async () => ({ status: 'ok' as const }))
  app.get('/version', { schema: { tags: ['system'] } }, async () => versionInfo)

  // Hazırlık: bağımlılıklar yanıt veriyor mu. Biri bile başarısızsa 503.
  app.get('/ready', { schema: { tags: ['system'] } }, async (_request, reply) => {
    const entries = await Promise.all(
      Object.entries(deps.readiness).map(async ([name, check]) => {
        if (!check) return [name, { ok: false, error: 'yapılandırılmamış' }] as const
        try {
          return [name, { ok: true, latencyMs: await check() }] as const
        } catch (error) {
          const message = error instanceof Error ? error.message : 'hata'
          return [name, { ok: false, error: message }] as const
        }
      }),
    )
    const ready = entries.every(([, result]) => result.ok)
    return reply
      .code(ready ? 200 : 503)
      .send({ status: ready ? 'ready' : 'not_ready', checks: Object.fromEntries(entries) })
  })

  app.get('/openapi.json', { schema: { hide: true } }, async () => app.swagger())

  const store = deps.sessionStore
  await registerAuthRoutes(app, {
    store,
    credentials:
      store && env.ADMIN_EMAIL && env.ADMIN_SETUP_TOKEN
        ? { email: env.ADMIN_EMAIL, setupToken: env.ADMIN_SETUP_TOKEN }
        : null,
  })

  app.get('/v1/admin/services', { schema: { tags: ['admin'] } }, async (request, reply) => {
    const session = store ? await requireAdmin(request, store) : null
    if (!session) return reply.code(401).send(UNAUTHORIZED)
    return collectServices({
      ...deps.probes,
      api: { version: versionInfo.version, gitSha: versionInfo.gitSha, startedAt },
    })
  })

  return app
}
