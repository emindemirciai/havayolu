import { currentVersion } from '@ucus/shared'
import Fastify, { type FastifyInstance } from 'fastify'
import type { Env } from './env'

export interface VersionInfo {
  app: 'ucus-takip'
  version: string
  gitSha: string
  buildTime: string | null
  env: Env['APP_ENV']
}

export function buildApp(env: Env): FastifyInstance {
  const app = Fastify({
    logger:
      env.LOG_LEVEL === 'silent'
        ? false
        : {
            level: env.LOG_LEVEL,
            redact: ['req.headers.authorization', 'req.headers.cookie', '*.token', '*.password'],
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
  app.get('/health', async () => ({ status: 'ok' as const }))

  app.get('/version', async () => versionInfo)

  return app
}
