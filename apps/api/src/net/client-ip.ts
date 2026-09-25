import { BlockList, isIP, isIPv4, isIPv6 } from 'node:net'
import type { FastifyRequest } from 'fastify'

/**
 * Cloudflare'in yayımladığı kenar ağları (https://www.cloudflare.com/ips-v4/ ve /ips-v6/,
 * 2026-09-25). Liste değişirse buradan güncellenir.
 */
export const CLOUDFLARE_CIDRS = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
] as const

/**
 * "adres" ya da "adres/önek" biçiminde geçerli bir IPv4/IPv6 ağı mı? /0 kabul edilmez: herkese
 * güvenmek demektir ve Fastify'ın proxy-addr'ı açılışta reddeder.
 */
export function isCidr(value: string): boolean {
  const [address, prefix, extra] = value.split('/')
  if (extra !== undefined || !address) return false
  const family = isIP(address)
  if (family === 0) return false
  if (prefix === undefined) return true
  if (!/^\d{1,3}$/.test(prefix)) return false
  const bits = Number(prefix)
  return bits >= 1 && bits <= (family === 4 ? 32 : 128)
}

function blockList(cidrs: readonly string[]): BlockList {
  const list = new BlockList()
  for (const cidr of cidrs) {
    const [address = '', prefix] = cidr.split('/')
    const type = isIPv6(address) ? 'ipv6' : 'ipv4'
    list.addSubnet(address, Number(prefix ?? (type === 'ipv4' ? 32 : 128)), type)
  }
  return list
}

const cloudflare = blockList(CLOUDFLARE_CIDRS)

/** IPv4-mapped IPv6 adresini (::ffff:1.2.3.4) düz IPv4'e çevirir. */
function normalize(ip: string): { address: string; type: 'ipv4' | 'ipv6' } | null {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)
  const address = mapped?.[1] ?? ip
  if (isIPv4(address)) return { address, type: 'ipv4' }
  if (isIPv6(address)) return { address, type: 'ipv6' }
  return null
}

export function isCloudflareAddress(ip: string): boolean {
  const parsed = normalize(ip)
  return parsed ? cloudflare.check(parsed.address, parsed.type) : false
}

/**
 * Hız sınırı anahtarı olan istemci IP'si (D-060).
 * - `request.ip`, Fastify `trustProxy` (TRUSTED_PROXY_CIDRS) ile X-Forwarded-For zincirinden
 *   çözülür: Traefik'in ve web sunucusunun eklediği son güvenilmeyen adres istemcidir.
 * - Cloudflare modunda CF-Connecting-IP yalnızca isteği ileten adres gerçekten bir Cloudflare
 *   ağındaysa kullanılır; sunucuya doğrudan gelen biri başlığı uydurarak sınırı aşamaz.
 */
export function clientIp(edgeProxy: 'cloudflare' | undefined, request: FastifyRequest): string {
  const header = request.headers['cf-connecting-ip']
  if (edgeProxy === 'cloudflare' && typeof header === 'string' && isCloudflareAddress(request.ip)) {
    const candidate = header.trim()
    if (isIP(candidate) !== 0) return candidate
  }
  return request.ip
}
