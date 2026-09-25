import { CHANGELOG } from '@ucus/shared'
import { afterAll, describe, expect, it } from 'vitest'
import { buildApp } from './app'
import { EnvError, parseEnv } from './env'

const env = parseEnv({ APP_ENV: 'test', LOG_LEVEL: 'silent', GIT_SHA: 'abc1234' })
const app = buildApp(env)
afterAll(() => app.close())

describe('api', () => {
  it('/health 200 ve ok döner', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('/version changelog sürümünü ve GIT_SHA değerini döner', async () => {
    const res = await app.inject({ method: 'GET', url: '/version' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({
      app: 'ucus-takip',
      version: CHANGELOG[0]?.version,
      gitSha: 'abc1234',
      env: 'test',
    })
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
    expect(parseEnv({ APP_ENV: 'production' }).API_PORT).toBe(4000)
    expect(parseEnv({ API_PORT: '' }).API_PORT).toBe(4100)
    expect(parsed.APP_ENV).toBe('development')
    expect(parsed.GIT_SHA).toBe('dev')
  })

  it('hatalı değerde anlaşılır hata verir', () => {
    expect(() => parseEnv({ API_PORT: 'abc' })).toThrow(EnvError)
    expect(() => parseEnv({ APP_ENV: 'staging' })).toThrow(/APP_ENV/)
  })
})
