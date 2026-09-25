import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeProbes } from '../test/helpers'
import { collectServices, PROBE_TIMEOUT_MS } from './services'

const api = { version: '0.3.0', gitSha: 'abc1234', startedAt: new Date('2026-09-25T11:00:00Z') }
const byId = (report: Awaited<ReturnType<typeof collectServices>>, id: string) =>
  report.services.find((s) => s.id === id)

afterEach(() => {
  vi.useRealTimers()
})

describe('collectServices', () => {
  it('her şey yolundaysa genel durum ok; yapılandırılmamış analiz genel durumu bozmaz', async () => {
    const report = await collectServices({ ...fakeProbes(), api })
    expect(report.overall).toBe('ok')
    expect(byId(report, 'analytics')?.state).toBe('not_configured')
    expect(byId(report, 'api')).toMatchObject({
      state: 'ok',
      version: '0.3.0',
      detail: { uptimeSec: 3600 },
    })
    expect(byId(report, 'redis-queue')?.detail).toEqual({ memoryUsedMb: 10, memoryMaxMb: 128 })
    expect(byId(report, 'worker:worker-rt')?.detail).toMatchObject({
      heartbeatAgeSec: 10,
      roles: 'ingest, engine',
    })
  })

  it("heartbeat'i olmayan beklenen worker down, eski heartbeat degraded olur", async () => {
    const report = await collectServices({
      ...fakeProbes({
        heartbeats: async () => [
          {
            service: 'worker-rt',
            roles: ['ingest'],
            version: '0.3.0',
            gitSha: 'x',
            pid: 1,
            startedAt: '2026-09-25T11:00:00Z',
            at: '2026-09-25T11:59:00Z',
          },
        ],
      }),
      api,
    })
    expect(byId(report, 'worker:worker-rt')?.state).toBe('degraded')
    expect(byId(report, 'worker:worker-bg')?.state).toBe('down')
    expect(report.overall).toBe('down')
  })

  it("Redis belleği maxmemory'nin %80'ini aşınca degraded olur", async () => {
    const report = await collectServices({
      ...fakeProbes({
        redisLive: async () => ({
          latencyMs: 1,
          usedBytes: 170 * 1024 * 1024,
          maxBytes: 192 * 1024 * 1024,
        }),
      }),
      api,
    })
    expect(byId(report, 'redis-live')?.state).toBe('degraded')
    expect(report.overall).toBe('degraded')
  })

  it('hata veren yoklama down olur ve hata metni raporlanır', async () => {
    const report = await collectServices({
      ...fakeProbes({ postgres: () => Promise.reject(new Error('ECONNREFUSED')) }),
      api,
    })
    expect(byId(report, 'postgres')).toMatchObject({
      state: 'down',
      detail: { error: 'ECONNREFUSED' },
    })
  })

  it('yanıt vermeyen yoklama zaman aşımında down olur, rapor takılmaz', async () => {
    vi.useFakeTimers()
    const pending = collectServices({
      ...fakeProbes({ http: () => new Promise(() => undefined) }),
      api,
    })
    await vi.advanceTimersByTimeAsync(PROBE_TIMEOUT_MS + 10)
    const report = await pending
    expect(byId(report, 'web')).toMatchObject({
      state: 'down',
      detail: { error: expect.stringMatching(/zaman aşımı/) },
    })
  })

  it('analiz uygulaması yapılandırılınca /api/health sonucu raporlanır', async () => {
    const report = await collectServices({
      ...fakeProbes({ analyticsUrl: 'http://analiz.test/api/health' }),
      api,
    })
    expect(byId(report, 'analytics')).toMatchObject({ state: 'ok', detail: { httpStatus: 200 } })
  })
})
