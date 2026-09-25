import { createHash, randomBytes } from 'node:crypto'
import type { Redis } from 'ioredis'

/** Panel oturum süresi. Analiz uygulaması token'ı 7 gün çerezde tutar ve her istekte doğrular. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const KEY_PREFIX = 'ut:admin_session:'

export type AdminRole = 'ADMIN'

export interface AdminSession {
  email: string
  role: AdminRole
  createdAt: string
}

export interface SessionStore {
  create(email: string): Promise<{ token: string; expiresInSeconds: number }>
  get(token: string): Promise<AdminSession | null>
  revoke(token: string): Promise<void>
}

/** Token opak ve rastgeledir; depoda yalnızca SHA-256 özeti tutulur (sızıntıda token geri üretilemez). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function newToken(): string {
  return randomBytes(32).toString('base64url')
}

export class RedisSessionStore implements SessionStore {
  constructor(private readonly redis: Redis) {}

  async create(email: string) {
    const token = newToken()
    const session: AdminSession = { email, role: 'ADMIN', createdAt: new Date().toISOString() }
    await this.redis.set(
      `${KEY_PREFIX}${hashToken(token)}`,
      JSON.stringify(session),
      'EX',
      SESSION_TTL_SECONDS,
    )
    return { token, expiresInSeconds: SESSION_TTL_SECONDS }
  }

  async get(token: string) {
    const raw = await this.redis.get(`${KEY_PREFIX}${hashToken(token)}`)
    return raw ? (JSON.parse(raw) as AdminSession) : null
  }

  async revoke(token: string) {
    await this.redis.del(`${KEY_PREFIX}${hashToken(token)}`)
  }
}
