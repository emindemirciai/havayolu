import { createServer, type Server } from 'node:http'

export interface HealthState {
  service: string
  roles: string[]
  version: string
  /** Son başarılı heartbeat; hiç yazılamadıysa null. */
  lastHeartbeatAt: Date | null
  /** Redis tanımlı değilse heartbeat beklenmez (yerel geliştirme). */
  heartbeatRequired: boolean
}

/** Heartbeat bu süreden eskiyse süreç sağlıksız sayılır (Docker HEALTHCHECK bunu okur). */
export const HEALTH_MAX_HEARTBEAT_AGE_MS = 45_000

export function healthStatus(state: HealthState, now: Date) {
  const ageMs = state.lastHeartbeatAt ? now.getTime() - state.lastHeartbeatAt.getTime() : null
  const healthy =
    !state.heartbeatRequired || (ageMs !== null && ageMs <= HEALTH_MAX_HEARTBEAT_AGE_MS)
  return {
    healthy,
    body: {
      status: healthy ? 'ok' : 'unhealthy',
      service: state.service,
      roles: state.roles,
      version: state.version,
      heartbeatAgeSec: ageMs === null ? null : Math.round(ageMs / 1000),
    },
  }
}

/** GET /health → 200 sağlıklı / 503 sağlıksız. Başka yol 404. */
export function startHealthServer(port: number, getState: () => HealthState): Server {
  const server = createServer((request, response) => {
    if (request.method !== 'GET' || request.url !== '/health') {
      response.writeHead(404, { 'content-type': 'application/json' }).end('{"status":"not_found"}')
      return
    }
    const { healthy, body } = healthStatus(getState(), new Date())
    response
      .writeHead(healthy ? 200 : 503, { 'content-type': 'application/json' })
      .end(JSON.stringify(body))
  })
  server.listen(port, '0.0.0.0')
  return server
}
