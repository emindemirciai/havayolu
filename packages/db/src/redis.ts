import { Redis, type RedisOptions } from 'ioredis'

export interface RedisClientOptions {
  /** Loglarda ve CLIENT LIST'te görünen ad. */
  name: string
  /**
   * BullMQ Worker bağlantıları için `null` olmalıdır (BullMQ üretim rehberi).
   * İstek yolundaki (API) bağlantılar hızlı hata versin diye küçük bir sayı kullanır.
   */
  maxRetriesPerRequest?: number | null
}

/**
 * ioredis 6 varsayılan olarak RESP3 kullanır; BullMQ ve Lua script'leriyle öngörülebilir yanıt
 * biçimi için RESP2'de kalınır (D-051).
 */
export function createRedis(url: string, { name, maxRetriesPerRequest = 2 }: RedisClientOptions) {
  const options: RedisOptions = {
    protocol: 2,
    connectionName: `havayolu:${name}`,
    maxRetriesPerRequest,
    connectTimeout: 5_000,
    lazyConnect: false,
  }
  return new Redis(url, options)
}

export interface RedisMemory {
  usedBytes: number
  maxBytes: number | null
}

/** INFO memory çıktısından kullanılan ve üst sınır belleği okur (maxmemory 0 = sınırsız → null). */
export async function redisMemory(redis: Redis): Promise<RedisMemory> {
  const info = await redis.info('memory')
  const read = (key: string) => {
    const match = new RegExp(`^${key}:(\\d+)`, 'm').exec(info)
    return match ? Number(match[1]) : 0
  }
  const maxBytes = read('maxmemory')
  return { usedBytes: read('used_memory'), maxBytes: maxBytes > 0 ? maxBytes : null }
}

/** Redis yanıt veriyor mu? Gecikmeyi ms olarak döndürür. */
export async function pingRedis(redis: Redis): Promise<number> {
  const started = performance.now()
  await redis.ping()
  return Math.round(performance.now() - started)
}

export const HEARTBEAT_PREFIX = 'hy:heartbeat:'
export const HEARTBEAT_TTL_SECONDS = 60

export interface Heartbeat {
  service: string
  roles: string[]
  version: string
  gitSha: string
  pid: number
  startedAt: string
  at: string
}

/** Worker sağlık kaydı: redis-queue'da TTL'li anahtar; admin Servisler paneli okur. */
export async function writeHeartbeat(redis: Redis, heartbeat: Heartbeat): Promise<void> {
  await redis.set(
    `${HEARTBEAT_PREFIX}${heartbeat.service}`,
    JSON.stringify(heartbeat),
    'EX',
    HEARTBEAT_TTL_SECONDS,
  )
}

export async function readHeartbeats(redis: Redis): Promise<Heartbeat[]> {
  const keys: string[] = []
  let cursor = '0'
  do {
    const [next, batch] = await redis.scan(cursor, 'MATCH', `${HEARTBEAT_PREFIX}*`, 'COUNT', 100)
    cursor = next
    keys.push(...batch)
  } while (cursor !== '0')
  if (keys.length === 0) return []
  const values = await redis.mget(...keys)
  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => JSON.parse(value) as Heartbeat)
    .sort((a, b) => a.service.localeCompare(b.service))
}
