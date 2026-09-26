// Deploy script'inin stub testleri: sahte Dokploy + sahte /version ve /ready sunucusu (yerel HTTP),
// sahte saat (bekleme anında geçer). Canlı servise istek atılmaz.
import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import {
  deployRequestBody,
  planFromEnv,
  runDeploy,
  shaMatches,
  type Clock,
  type DeployConfig,
  type Deployment,
} from './deploy-dokploy.mts'

const NEW_SHA = '1234567890abcdef1234567890abcdef12345678'
const OLD_SHA = 'abcdefabcdefabcdefabcdefabcdefabcdefabcd'
const TOKEN = 'test-token-degeri'

interface Scenario {
  /** compose.deploy'dan kaç liste sorgusu sonra yeni deployment görünür (kuyruk süresi). */
  appearAfterPolls: number
  /** Yeni deployment'ın sırayla alacağı durumlar; son durum kalıcıdır. */
  statuses: string[]
  /** Yayından kaç doğrulama turu sonra /version yeni SHA'yı döndürür (Infinity = hiç). */
  shaAfterProbes: number
  readyStatus: number
  listStatus?: number
}

interface Recorded {
  method: string
  path: string
  headers: IncomingMessage['headers']
  body: string
}

class FakeClock implements Clock {
  current = 0
  now() {
    return this.current
  }
  async sleep(ms: number) {
    this.current += ms
  }
}

const servers: Server[] = []
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))))
})

async function startStub(scenario: Scenario) {
  const requests: Recorded[] = []
  const existing: Deployment[] = [
    { deploymentId: 'eski-1', status: 'done', title: 'önceki', createdAt: '2026-09-25T10:00:00Z' },
  ]
  let deployed = false
  let pollsSinceDeploy = 0
  let statusIndex = 0
  let versionProbes = 0

  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk.toString()))
    req.on('end', () => {
      const url = new URL(req.url ?? '/', 'http://stub')
      requests.push({ method: req.method ?? '', path: url.pathname, headers: req.headers, body })
      const json = (status: number, payload: unknown) => {
        res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(payload))
      }
      if (url.pathname.startsWith('/api/deployment.') || url.pathname === '/api/compose.deploy') {
        if (req.headers['x-api-key'] !== TOKEN) return json(401, { message: 'Unauthorized' })
      }
      if (url.pathname === '/api/deployment.allByCompose') {
        if (scenario.listStatus) return json(scenario.listStatus, { message: 'hata' })
        if (!deployed) return json(200, existing)
        pollsSinceDeploy += 1
        if (pollsSinceDeploy <= scenario.appearAfterPolls) return json(200, existing)
        const status = scenario.statuses[Math.min(statusIndex, scenario.statuses.length - 1)]
        statusIndex += 1
        return json(200, [
          { deploymentId: 'yeni-1', status, title: 'commit mesajı', errorMessage: null },
          ...existing,
        ])
      }
      if (url.pathname === '/api/compose.deploy' && req.method === 'POST') {
        deployed = true
        return json(200, { success: true, message: 'Deployment queued', composeId: 'cmp-1' })
      }
      if (url.pathname === '/version' || url.pathname === '/api/version') {
        if (url.pathname === '/version') versionProbes += 1
        const gitSha = versionProbes > scenario.shaAfterProbes ? NEW_SHA : OLD_SHA
        return json(200, { app: 'havayolu', version: '0.4.0', gitSha })
      }
      if (url.pathname === '/ready') return json(scenario.readyStatus, { status: 'x' })
      return json(404, { message: 'yok' })
    })
  })
  servers.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return { base: `http://127.0.0.1:${port}`, requests }
}

function configFor(base: string, overrides: Partial<DeployConfig> = {}): DeployConfig {
  return {
    dokployUrl: base,
    apiToken: TOKEN,
    composeId: 'cmp-1',
    apiUrl: base,
    webUrl: base,
    expectedSha: NEW_SHA,
    title: 'gh-1234567-99',
    pollIntervalMs: 10_000,
    deployTimeoutMs: 15 * 60_000,
    verifyTimeoutMs: 15 * 60_000,
    ...overrides,
  }
}

async function deploy(scenario: Scenario, overrides: Partial<DeployConfig> = {}) {
  const stub = await startStub(scenario)
  const clock = new FakeClock()
  const lines: string[] = []
  const result = await runDeploy(configFor(stub.base, overrides), {
    fetch: globalThis.fetch,
    clock,
    log: (line) => lines.push(line),
  })
  return { result, requests: stub.requests, clock, lines }
}

const happy: Scenario = {
  appearAfterPolls: 0,
  statuses: ['running', 'running', 'done'],
  shaAfterProbes: 2,
  readyStatus: 200,
}

describe('deploy-dokploy', () => {
  it('başarılı yayında 0 döner; compose.deploy gövdesi yalnızca composeId ve title taşır', async () => {
    const { result, requests, lines } = await deploy(happy)
    expect(result.ok).toBe(true)
    expect(result.summary).toMatch(/^YAYINLANDI: 1234567/)
    const posts = requests.filter((r) => r.method === 'POST')
    expect(posts.map((r) => r.path)).toEqual(['/api/compose.deploy'])
    for (const post of posts) {
      expect(JSON.parse(post.body)).toEqual({ composeId: 'cmp-1', title: 'gh-1234567-99' })
      expect(post.body).not.toContain('freshVolumes')
      expect(post.headers['x-api-key']).toBe(TOKEN)
    }
    expect(requests.some((r) => r.path === '/api/compose.redeploy')).toBe(false)
    expect(lines.join('\n')).not.toContain(TOKEN)
  })

  it('freshVolumes hiçbir yapılandırmayla gövdeye girmez', () => {
    const body = deployRequestBody({ composeId: 'c', title: 't', freshVolumes: true } as never)
    expect(JSON.parse(body)).toEqual({ composeId: 'c', title: 't' })
    expect(body).not.toContain('freshVolumes')
  })

  it('kuyrukta bekleme süresine izin verir (yeni kayıt geç görünse de başarılı)', async () => {
    const { result } = await deploy({ ...happy, appearAfterPolls: 12 })
    expect(result.ok).toBe(true)
  })

  it('deployment error → 1', async () => {
    const { result } = await deploy({ ...happy, statuses: ['running', 'error'] })
    expect(result.ok).toBe(false)
    expect(result.summary).toMatch(/deployment error/)
  })

  it('deployment cancelled → 1', async () => {
    const { result } = await deploy({ ...happy, statuses: ['cancelled'] })
    expect(result.ok).toBe(false)
    expect(result.summary).toMatch(/cancelled/)
  })

  it('yeni deployment 15 dk içinde görünmezse → 1', async () => {
    const { result, clock } = await deploy({ ...happy, appearAfterPolls: Number.POSITIVE_INFINITY })
    expect(result.ok).toBe(false)
    expect(result.summary).toMatch(/15 dk içinde bitmedi/)
    expect(clock.current).toBeGreaterThanOrEqual(15 * 60_000)
  })

  it('/version 15 dk boyunca eski SHA döndürürse → 1', async () => {
    const { result, clock } = await deploy({ ...happy, shaAfterProbes: Number.POSITIVE_INFINITY })
    expect(result.ok).toBe(false)
    expect(result.summary).toMatch(/doğrulanamadı.*eski SHA abcdefa/)
    expect(clock.current).toBeGreaterThanOrEqual(15 * 60_000)
  })

  it('/ready 503 kalırsa → 1', async () => {
    const { result } = await deploy({ ...happy, readyStatus: 503 })
    expect(result.ok).toBe(false)
    expect(result.summary).toMatch(/API \/ready: HTTP 503/)
  })

  it('Dokploy yetkisiz (401) → 1 ve anahtar loglanmaz', async () => {
    const { result } = await deploy(happy, { apiToken: 'yanlis-anahtar' })
    expect(result.ok).toBe(false)
    expect(result.summary).toMatch(/HTTP 401/)
    expect(result.summary).not.toContain('yanlis-anahtar')
  })
})

describe('shaMatches', () => {
  it('tam SHA, kısa SHA (rollback) ve eşleşmeyenler', () => {
    expect(shaMatches(NEW_SHA, NEW_SHA)).toBe(true)
    expect(shaMatches(NEW_SHA, '1234567')).toBe(true)
    expect(shaMatches(NEW_SHA.toUpperCase(), NEW_SHA)).toBe(true)
    expect(shaMatches(OLD_SHA, NEW_SHA)).toBe(false)
    expect(shaMatches('123456', NEW_SHA)).toBe(false)
    expect(shaMatches('dev', NEW_SHA)).toBe(false)
    expect(shaMatches(undefined, NEW_SHA)).toBe(false)
  })
})

describe('planFromEnv', () => {
  const complete = {
    DEPLOY_ENABLED: 'true',
    DOKPLOY_URL: 'https://panel.example.test',
    DOKPLOY_API_TOKEN: TOKEN,
    DOKPLOY_COMPOSE_ID: 'cmp-1',
    API_URL: 'https://api.example.test',
    WEB_URL: 'https://example.test',
    EXPECTED_SHA: NEW_SHA,
    GITHUB_RUN_ID: '42',
  }

  it('DEPLOY_ENABLED yoksa ya da deneme çalışmasıysa temiz biçimde atlar', () => {
    expect(planFromEnv({}).kind).toBe('skip')
    expect(planFromEnv({ ...complete, DEPLOY_ENABLED: 'false' }).kind).toBe('skip')
    expect(planFromEnv({ ...complete, DRY_RUN: 'true' }).kind).toBe('skip')
  })

  it('DEPLOY_ENABLED=true iken eksik ayar hatadır; değer değil yalnızca ad yazılır', () => {
    const plan = planFromEnv({ ...complete, DOKPLOY_API_TOKEN: '', WEB_URL: ' ' })
    expect(plan.kind).toBe('error')
    expect(plan.kind === 'error' && plan.summary).toMatch(/DOKPLOY_API_TOKEN, WEB_URL/)
  })

  it('https olmayan adresleri ve geçersiz SHA değerini reddeder', () => {
    expect(planFromEnv({ ...complete, DOKPLOY_URL: 'http://72.62.53.122:3000' }).kind).toBe('error')
    expect(planFromEnv({ ...complete, EXPECTED_SHA: 'main' }).kind).toBe('error')
  })

  it('başlığı gh-<sha7>-<run_id> olarak kurar', () => {
    const plan = planFromEnv(complete)
    expect(plan.kind).toBe('run')
    expect(plan.kind === 'run' && plan.config.title).toBe('gh-1234567-42')
    expect(plan.kind === 'run' && plan.config.pollIntervalMs).toBe(10_000)
  })
})
