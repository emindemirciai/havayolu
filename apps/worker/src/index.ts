import { createRedis, writeHeartbeat } from '@ucus/db'
import { currentVersion } from '@ucus/shared'
import { pino } from 'pino'
import { EnvError, loadDotEnvForDevelopment, parseEnv, type Env } from './env'
import { startHealthServer, type HealthState } from './health'
import { parseRoles, RoleError, type WorkerRole } from './roles'

/** Heartbeat aralığı; kayıt 60 sn TTL ile yazılır (packages/db → HEARTBEAT_TTL_SECONDS). */
const HEARTBEAT_INTERVAL_MS = 15_000

loadDotEnvForDevelopment()

let env: Env
let roles: WorkerRole[]
try {
  env = parseEnv(process.env)
  roles = parseRoles(env.WORKER_ROLE, env.APP_ENV)
} catch (error) {
  if (error instanceof EnvError || error instanceof RoleError) {
    console.error(error.message)
    process.exit(1)
  }
  throw error
}

const log = pino({ level: env.LOG_LEVEL, base: { service: env.WORKER_SERVICE_NAME } })
const version = currentVersion()
const startedAt = new Date().toISOString()
const redis = env.REDIS_QUEUE_URL
  ? createRedis(env.REDIS_QUEUE_URL, { name: env.WORKER_SERVICE_NAME, maxRetriesPerRequest: null })
  : null

const state: HealthState = {
  service: env.WORKER_SERVICE_NAME,
  roles,
  version,
  lastHeartbeatAt: null,
  heartbeatRequired: redis !== null,
}

async function beat() {
  if (!redis) return
  try {
    await writeHeartbeat(redis, {
      service: env.WORKER_SERVICE_NAME,
      roles,
      version,
      gitSha: env.GIT_SHA,
      pid: process.pid,
      startedAt,
      at: new Date().toISOString(),
    })
    state.lastHeartbeatAt = new Date()
  } catch (error) {
    log.warn({ err: error }, 'heartbeat yazılamadı')
  }
}

if (!redis)
  log.warn('REDIS_QUEUE_URL tanımlı değil: heartbeat yazılmayacak (yalnızca yerel geliştirme)')
await beat()
const timer = setInterval(() => void beat(), HEARTBEAT_INTERVAL_MS)
const health = startHealthServer(env.WORKER_HEALTH_PORT, () => state)
log.info({ roles, version, healthPort: env.WORKER_HEALTH_PORT }, 'worker başladı')

const shutdown = async (signal: string) => {
  log.info({ signal }, 'kapanıyor')
  clearInterval(timer)
  health.close()
  try {
    await redis?.quit()
    process.exit(0)
  } catch (error) {
    log.error({ err: error }, 'kapanış sırasında hata')
    process.exit(1)
  }
}
process.once('SIGTERM', () => void shutdown('SIGTERM'))
process.once('SIGINT', () => void shutdown('SIGINT'))
