import type { Heartbeat } from '@havayolu/db'
import { overallState, type ServicesReport, type ServiceStatus } from '@havayolu/shared'

/** Her yoklama bu süreyi aşarsa servis "down" sayılır; panel asla takılmaz. */
export const PROBE_TIMEOUT_MS = 2_000
/** Heartbeat bu kadar eskiyse worker "degraded" (kayıt 60 sn TTL ile silinince "down"). */
export const HEARTBEAT_STALE_MS = 45_000
/** Redis belleği maxmemory'nin bu oranını aşarsa "degraded" (infra.md uyarı eşiği). */
export const REDIS_MEMORY_WARN_RATIO = 0.8

export interface RedisProbeResult {
  latencyMs: number
  usedBytes: number
  maxBytes: number | null
}

export interface HttpProbeResult {
  status: number
  body: unknown
  latencyMs: number
}

/** Servis yoklamaları; üretimde gerçek bağlantılar, testte sahte uygulamalar verilir. */
export interface ServiceProbes {
  api: { version: string; gitSha: string; startedAt: Date }
  postgres: (() => Promise<{ latencyMs: number }>) | null
  redisQueue: (() => Promise<RedisProbeResult>) | null
  redisLive: (() => Promise<RedisProbeResult>) | null
  heartbeats: (() => Promise<Heartbeat[]>) | null
  http: (url: string) => Promise<HttpProbeResult>
  webUrl: string | null
  analyticsUrl: string | null
  expectedWorkers: string[]
  now: () => Date
}

async function withTimeout<T>(promise: Promise<T>, ms = PROBE_TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`zaman aşımı (${ms} ms)`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error))

function base(id: string, kind: ServiceStatus['kind'], checkedAt: string): ServiceStatus {
  return { id, kind, state: 'ok', version: null, latencyMs: null, detail: {}, checkedAt }
}

async function redisStatus(
  id: string,
  probe: ServiceProbes['redisQueue'],
  checkedAt: string,
): Promise<ServiceStatus> {
  const status = base(id, 'redis', checkedAt)
  if (!probe) return { ...status, state: 'not_configured' }
  try {
    const result = await withTimeout(probe())
    const ratio = result.maxBytes ? result.usedBytes / result.maxBytes : null
    return {
      ...status,
      state: ratio !== null && ratio > REDIS_MEMORY_WARN_RATIO ? 'degraded' : 'ok',
      latencyMs: result.latencyMs,
      detail: {
        memoryUsedMb: Math.round((result.usedBytes / 1024 / 1024) * 10) / 10,
        memoryMaxMb: result.maxBytes ? Math.round(result.maxBytes / 1024 / 1024) : null,
      },
    }
  } catch (error) {
    return { ...status, state: 'down', detail: { error: errorText(error) } }
  }
}

async function httpVersionStatus(
  id: string,
  kind: 'web' | 'analytics',
  url: string | null,
  probes: ServiceProbes,
  checkedAt: string,
): Promise<ServiceStatus> {
  const status = base(id, kind, checkedAt)
  if (!url) return { ...status, state: 'not_configured' }
  try {
    const result = await withTimeout(probes.http(url))
    const body = (result.body ?? {}) as Record<string, unknown>
    const version = typeof body.version === 'string' ? body.version : null
    return {
      ...status,
      state: result.status >= 200 && result.status < 300 ? 'ok' : 'down',
      latencyMs: result.latencyMs,
      version,
      detail: { httpStatus: result.status },
    }
  } catch (error) {
    return { ...status, state: 'down', detail: { error: errorText(error) } }
  }
}

async function workerStatuses(probes: ServiceProbes, checkedAt: string): Promise<ServiceStatus[]> {
  if (!probes.heartbeats) {
    return probes.expectedWorkers.map((name) => ({
      ...base(`worker:${name}`, 'worker', checkedAt),
      state: 'not_configured' as const,
    }))
  }
  let heartbeats: Heartbeat[]
  try {
    heartbeats = await withTimeout(probes.heartbeats())
  } catch (error) {
    return probes.expectedWorkers.map((name) => ({
      ...base(`worker:${name}`, 'worker', checkedAt),
      state: 'down' as const,
      detail: { error: errorText(error) },
    }))
  }
  const now = probes.now().getTime()
  const names = new Set([...probes.expectedWorkers, ...heartbeats.map((h) => h.service)])
  return [...names].sort().map((name): ServiceStatus => {
    const status = base(`worker:${name}`, 'worker', checkedAt)
    const heartbeat = heartbeats.find((h) => h.service === name)
    if (!heartbeat) return { ...status, state: 'down', detail: { heartbeatAgeSec: null } }
    const ageMs = now - Date.parse(heartbeat.at)
    return {
      ...status,
      state: ageMs > HEARTBEAT_STALE_MS ? 'degraded' : 'ok',
      version: heartbeat.version,
      detail: {
        heartbeatAgeSec: Math.max(0, Math.round(ageMs / 1000)),
        roles: heartbeat.roles.join(', ') || null,
        gitSha: heartbeat.gitSha,
      },
    }
  })
}

/** Bütün servislerin durumunu paralel toplar. Hiçbir yoklama raporu bozamaz ya da geciktiremez. */
export async function collectServices(probes: ServiceProbes): Promise<ServicesReport> {
  const checkedAt = probes.now().toISOString()
  const api: ServiceStatus = {
    ...base('api', 'api', checkedAt),
    version: probes.api.version,
    detail: {
      gitSha: probes.api.gitSha,
      uptimeSec: Math.round((probes.now().getTime() - probes.api.startedAt.getTime()) / 1000),
    },
  }

  const postgresPromise = (async (): Promise<ServiceStatus> => {
    const status = base('postgres', 'postgres', checkedAt)
    if (!probes.postgres) return { ...status, state: 'not_configured' }
    try {
      const { latencyMs } = await withTimeout(probes.postgres())
      return { ...status, latencyMs }
    } catch (error) {
      return { ...status, state: 'down', detail: { error: errorText(error) } }
    }
  })()

  const [web, workers, postgres, redisQueue, redisLive, analytics] = await Promise.all([
    httpVersionStatus('web', 'web', probes.webUrl, probes, checkedAt),
    workerStatuses(probes, checkedAt),
    postgresPromise,
    redisStatus('redis-queue', probes.redisQueue, checkedAt),
    redisStatus('redis-live', probes.redisLive, checkedAt),
    httpVersionStatus('analytics', 'analytics', probes.analyticsUrl, probes, checkedAt),
  ])

  const services = [web, api, ...workers, postgres, redisQueue, redisLive, analytics]
  return { checkedAt, overall: overallState(services), services }
}
