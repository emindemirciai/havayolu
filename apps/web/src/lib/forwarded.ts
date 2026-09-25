import 'server-only'
import { headers } from 'next/headers'

/**
 * Web sunucusu API'yi iç ağdan çağırır. Hız sınırı tüm ziyaretçiler için tek bir sayaç (web
 * konteynerinin IP'si) olmasın diye isteğin geldiği istemci başlıkları olduğu gibi iletilir.
 * API bunlara yalnızca güvendiği iç ağdan (TRUSTED_PROXY_CIDRS) gelince itibar eder ve
 * Cloudflare başlığını ayrıca doğrular (D-060).
 */
const CLIENT_HEADERS = ['x-forwarded-for', 'cf-connecting-ip'] as const

export async function clientForwardHeaders(): Promise<Record<string, string>> {
  const incoming = await headers()
  const forwarded: Record<string, string> = {}
  for (const name of CLIENT_HEADERS) {
    const value = incoming.get(name)
    if (value) forwarded[name] = value
  }
  return forwarded
}
