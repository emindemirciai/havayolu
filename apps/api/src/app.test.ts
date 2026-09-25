import { CHANGELOG } from '@havayolu/shared'
import { afterAll, describe, expect, it } from 'vitest'
import { allowedOrigins } from './app'
import { EnvError, parseEnv } from './env'
import { testApp, testEnv } from './test/helpers'

const { app } = await testApp()
afterAll(() => app.close())

describe('sistem uç noktaları', () => {
  it('/health 200 ve ok döner', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('/version changelog sürümünü ve GIT_SHA değerini döner', async () => {
    const res = await app.inject({ method: 'GET', url: '/version' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({
      app: 'havayolu',
      version: CHANGELOG[0]?.version,
      gitSha: 'abc1234',
      env: 'test',
    })
  })

  it('güvenlik başlıklarını ekler', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['strict-transport-security']).toBeDefined()
  })

  it('/ready bütün bağımlılıklar yanıt verince 200, biri düşünce 503 döner', async () => {
    const ok = await app.inject({ method: 'GET', url: '/ready' })
    expect(ok.statusCode).toBe(200)
    expect(ok.json()).toMatchObject({ status: 'ready' })

    const { app: broken } = await testApp({
      deps: {
        readiness: {
          postgres: async () => 1,
          redisQueue: () => Promise.reject(new Error('bağlantı reddedildi')),
          redisLive: null,
        },
      },
    })
    const res = await broken.inject({ method: 'GET', url: '/ready' })
    expect(res.statusCode).toBe(503)
    expect(res.json()).toMatchObject({
      status: 'not_ready',
      checks: {
        postgres: { ok: true },
        redisQueue: { ok: false, error: 'erişilemiyor' },
        redisLive: { ok: false, error: 'yapılandırılmamış' },
      },
    })
    // Sürücü hata metni (iç adres, kullanıcı adı) herkese açık yanıtta yer almaz.
    expect(res.body).not.toContain('bağlantı reddedildi')
    await broken.close()
  })

  it('/openapi.json auth uç noktalarını içerir', async () => {
    const res = await app.inject({ method: 'GET', url: '/openapi.json' })
    expect(res.statusCode).toBe(200)
    const spec = res.json() as { openapi: string; paths: Record<string, unknown> }
    expect(spec.openapi).toMatch(/^3\./)
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining(['/api/auth/login', '/api/admin/session', '/v1/admin/services']),
    )
  })

  it('bilinmeyen yol 404 döner', async () => {
    const res = await app.inject({ method: 'GET', url: '/yok' })
    expect(res.statusCode).toBe(404)
  })
})

describe('env', () => {
  it('varsayılanları uygular', () => {
    const parsed = parseEnv({})
    expect(parsed.API_PORT).toBe(4100)
    expect(parsed.APP_ENV).toBe('development')
    expect(parsed.GIT_SHA).toBe('dev')
    expect(parsed.EXPECTED_WORKERS).toEqual(['worker-rt', 'worker-bg'])
    expect(parseEnv({ API_PORT: '' }).API_PORT).toBe(4100)
  })

  it('üretimde port 4000; veri bağlantıları ve güvenilen proxy ağları zorunlu', () => {
    const production = {
      APP_ENV: 'production',
      DATABASE_URL: 'postgres://u:p@db:5432/app',
      REDIS_QUEUE_URL: 'redis://:p@rq:6379/0',
      REDIS_LIVE_URL: 'redis://:p@rl:6379/0',
      TRUSTED_PROXY_CIDRS: '10.0.0.0/8, 172.16.0.0/12',
    }
    expect(() => parseEnv({ APP_ENV: 'production' })).toThrow(/DATABASE_URL/)
    expect(() => parseEnv({ ...production, TRUSTED_PROXY_CIDRS: '' })).toThrow(
      /TRUSTED_PROXY_CIDRS/,
    )
    const prod = parseEnv(production)
    expect(prod.API_PORT).toBe(4000)
    expect(prod.TRUSTED_PROXY_CIDRS).toEqual(['10.0.0.0/8', '172.16.0.0/12'])
  })

  it('geçersiz proxy ağı reddedilir; boş GIT_SHA açılışı engellemez', () => {
    expect(() => parseEnv({ TRUSTED_PROXY_CIDRS: '10.0.0.0/33' })).toThrow(/TRUSTED_PROXY_CIDRS/)
    expect(() => parseEnv({ TRUSTED_PROXY_CIDRS: 'traefik' })).toThrow(/TRUSTED_PROXY_CIDRS/)
    expect(parseEnv({ GIT_SHA: '' }).GIT_SHA).toBe('dev')
    expect(parseEnv({ GIT_SHA: '  ' }).GIT_SHA).toBe('dev')
  })

  it('yönetici bilgileri birlikte tanımlanmalı ve anahtar en az 32 karakter olmalı', () => {
    expect(() => parseEnv({ ADMIN_EMAIL: 'a@b.co' })).toThrow(EnvError)
    expect(() => parseEnv({ ADMIN_EMAIL: 'a@b.co', ADMIN_SETUP_TOKEN: 'kisa' })).toThrow(/32/)
    expect(() => parseEnv({ API_PORT: 'abc' })).toThrow(EnvError)
    expect(() => parseEnv({ APP_ENV: 'staging' })).toThrow(/APP_ENV/)
  })

  it("CORS yalnızca web ve admin host'larına izin verir", () => {
    expect(
      allowedOrigins(testEnv({ WEB_HOST: 'havayolu.live', ADMIN_HOST: 'admin.havayolu.live' })),
    ).toEqual(['https://havayolu.live', 'https://admin.havayolu.live'])
    expect(allowedOrigins(testEnv({ WEB_HOST: 'localhost:3100' }))).toEqual([
      'http://localhost:3100',
    ])
    expect(allowedOrigins(testEnv())).toEqual([])
  })
})
