import 'server-only'

export type ApiStatus =
  | { reachable: true; version: string; gitSha: string; checkedAt: string }
  | { reachable: false; checkedAt: string }

interface VersionPayload {
  version: string
  gitSha: string
}

function isVersionPayload(value: unknown): value is VersionPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as VersionPayload).version === 'string' &&
    typeof (value as VersionPayload).gitSha === 'string'
  )
}

/** API'nin canlılığını ve sürümünü kısa bir zaman aşımıyla sorgular. Ulaşılamazsa hata fırlatmaz. */
export async function fetchApiStatus(baseUrl: string, timeoutMs = 1500): Promise<ApiStatus> {
  const checkedAt = new Date().toISOString()
  try {
    const [health, version] = await Promise.all([
      fetch(new URL('/health', baseUrl), {
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      }),
      fetch(new URL('/version', baseUrl), {
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      }),
    ])
    if (!health.ok || !version.ok) return { reachable: false, checkedAt }
    const payload: unknown = await version.json()
    if (!isVersionPayload(payload)) return { reachable: false, checkedAt }
    return { reachable: true, version: payload.version, gitSha: payload.gitSha, checkedAt }
  } catch {
    return { reachable: false, checkedAt }
  }
}
