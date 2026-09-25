import 'server-only'
import type { ServicesReport } from '@havayolu/shared'
import { getServerEnv } from './env'

/** Yönetici oturum token'ının tutulduğu çerez (httpOnly; yalnızca /admin altında gönderilir). */
export const ADMIN_COOKIE = 'hy_admin'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export type LoginFailure = 'invalid' | 'rate_limited' | 'disabled' | 'unavailable'

const TIMEOUT_MS = 5_000

function apiUrl(path: string): string {
  return new URL(path, getServerEnv().API_INTERNAL_URL).toString()
}

/** API'nin platform-admin sözleşmesiyle giriş yapar (analiz uygulamasıyla aynı uç nokta). */
export async function loginToApi(
  email: string,
  password: string,
): Promise<{ ok: true; token: string } | { ok: false; reason: LoginFailure }> {
  let response: Response
  try {
    response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
  if (response.status === 429) return { ok: false, reason: 'rate_limited' }
  if (response.status === 404) return { ok: false, reason: 'disabled' }
  if (!response.ok) return { ok: false, reason: response.status >= 500 ? 'unavailable' : 'invalid' }
  const body = (await response.json().catch(() => ({}))) as { token?: unknown }
  return typeof body.token === 'string' && body.token
    ? { ok: true, token: body.token }
    : { ok: false, reason: 'unavailable' }
}

export async function fetchServices(
  token: string,
): Promise<
  { ok: true; report: ServicesReport } | { ok: false; reason: 'unauthorized' | 'unavailable' }
> {
  try {
    const response = await fetch(apiUrl('/v1/admin/services'), {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (response.status === 401) return { ok: false, reason: 'unauthorized' }
    if (!response.ok) return { ok: false, reason: 'unavailable' }
    return { ok: true, report: (await response.json()) as ServicesReport }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

export async function logoutFromApi(token: string): Promise<void> {
  try {
    await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    // API'ye ulaşılamasa da yerel çerez silinir; token 7 gün sonra kendiliğinden düşer.
  }
}
