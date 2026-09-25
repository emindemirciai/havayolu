/** Worker rolleri (CLAUDE.md → Mimari). Kod düzeni: src/{ingest,engine,notifier,jobs}/. */
export const WORKER_ROLES = ['ingest', 'engine', 'notifier', 'jobs'] as const
export type WorkerRole = (typeof WORKER_ROLES)[number]

export class RoleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RoleError'
  }
}

/**
 * `WORKER_ROLE` değerini ayrıştırır: virgülle ayrılmış rol listesi ya da `all`.
 * `all` yalnızca yerel geliştirmede kullanılır; üretimde iki servis (rt, bg) ayrı rol kümeleri alır.
 */
export function parseRoles(value: string, appEnv: string): WorkerRole[] {
  const parts = value
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
  if (parts.length === 0) throw new RoleError('WORKER_ROLE boş olamaz.')
  if (parts.includes('all')) {
    if (appEnv === 'production') {
      throw new RoleError(
        "WORKER_ROLE=all üretimde kullanılamaz; 'ingest,engine' ya da 'notifier,jobs' ver.",
      )
    }
    return [...WORKER_ROLES]
  }
  const unknown = parts.filter((p) => !(WORKER_ROLES as readonly string[]).includes(p))
  if (unknown.length > 0) {
    throw new RoleError(
      `Bilinmeyen rol: ${unknown.join(', ')}. Geçerli roller: ${WORKER_ROLES.join(', ')}.`,
    )
  }
  return [...new Set(parts as WorkerRole[])]
}
