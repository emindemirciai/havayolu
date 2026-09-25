import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export interface DbOptions {
  /** Bağlantı havuzu üst sınırı. api ve worker havuzlarının toplamı ≤ 30 (infra.md). */
  max?: number
  applicationName?: string
}

/** Uygulama genelinde kullanılan PostgreSQL bağlantısı ve Drizzle istemcisi. */
export function createDb(databaseUrl: string, options: DbOptions = {}) {
  const sql = postgres(databaseUrl, {
    max: options.max ?? 5,
    idle_timeout: 30,
    connect_timeout: 5,
    connection: { application_name: options.applicationName ?? 'havayolu' },
    onnotice: () => undefined,
  })
  return { sql, db: drizzle(sql) }
}

export type Database = ReturnType<typeof createDb>

/** Hazırlık kontrolü: veritabanı yanıt veriyor mu? Gecikmeyi ms olarak döndürür. */
export async function pingDb(sql: Database['sql']): Promise<number> {
  const started = performance.now()
  await sql`select 1`
  return Math.round(performance.now() - started)
}
