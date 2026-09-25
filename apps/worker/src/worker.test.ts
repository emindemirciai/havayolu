import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'
import { HEALTH_MAX_HEARTBEAT_AGE_MS, healthStatus, type HealthState } from './health'
import { parseRoles, RoleError, WORKER_ROLES } from './roles'

describe('parseRoles', () => {
  it('virgülle ayrılmış rolleri ayrıştırır, tekrarları atar', () => {
    expect(parseRoles('ingest, engine,ingest', 'production')).toEqual(['ingest', 'engine'])
    expect(parseRoles('NOTIFIER,jobs', 'production')).toEqual(['notifier', 'jobs'])
  })

  it('all yerelde bütün rolleri verir, üretimde reddedilir', () => {
    expect(parseRoles('all', 'development')).toEqual([...WORKER_ROLES])
    expect(() => parseRoles('all', 'production')).toThrow(RoleError)
  })

  it('bilinmeyen ya da boş rol hata verir', () => {
    expect(() => parseRoles('ingest,uydurma', 'development')).toThrow(/uydurma/)
    expect(() => parseRoles(' , ', 'development')).toThrow(RoleError)
  })
})

describe('healthStatus', () => {
  const base: HealthState = {
    service: 'worker-rt',
    roles: ['ingest'],
    version: '0.3.0',
    lastHeartbeatAt: null,
    heartbeatRequired: true,
  }
  const now = new Date('2026-09-25T12:00:00Z')

  it('taze heartbeat sağlıklıdır', () => {
    const result = healthStatus({ ...base, lastHeartbeatAt: new Date(now.getTime() - 10_000) }, now)
    expect(result.healthy).toBe(true)
    expect(result.body).toMatchObject({ status: 'ok', heartbeatAgeSec: 10 })
  })

  it('heartbeat hiç yoksa ya da eskiyse sağlıksızdır', () => {
    expect(healthStatus(base, now).healthy).toBe(false)
    const stale = new Date(now.getTime() - HEALTH_MAX_HEARTBEAT_AGE_MS - 1)
    expect(healthStatus({ ...base, lastHeartbeatAt: stale }, now).healthy).toBe(false)
  })

  it('Redis yoksa (yerel) heartbeat beklenmez', () => {
    expect(healthStatus({ ...base, heartbeatRequired: false }, now).healthy).toBe(true)
  })
})

describe('env', () => {
  it('varsayılanlar ve üretim kuralı', () => {
    const parsed = parseEnv({})
    expect(parsed.WORKER_ROLE).toBe('all')
    expect(parsed.WORKER_HEALTH_PORT).toBe(4200)
    expect(parsed.WORKER_SERVICE_NAME).toBe('worker-dev')
    expect(() => parseEnv({ APP_ENV: 'production' })).toThrow(/REDIS_QUEUE_URL/)
    expect(() => parseEnv({ WORKER_SERVICE_NAME: 'Worker RT' })).toThrow()
  })
})
