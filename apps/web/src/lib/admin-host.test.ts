import { describe, expect, it } from 'vitest'
import { adminRouting } from './admin-host'

describe('adminRouting', () => {
  it('ADMIN_HOST yoksa her şey geçer (yerel geliştirme)', () => {
    expect(adminRouting(undefined, 'localhost:3100', '/admin')).toEqual({ action: 'next' })
    expect(adminRouting('', 'localhost:3100', '/durum')).toEqual({ action: 'next' })
  })

  it("admin host'unda /admin dışı sayfalar /admin'e yönlenir; API ve varlıklar geçer", () => {
    const host = 'ucus-admin.example.com'
    expect(adminRouting(host, host, '/')).toEqual({ action: 'redirect', location: '/admin' })
    expect(adminRouting(host, 'UCUS-ADMIN.example.com', '/durum')).toEqual({
      action: 'redirect',
      location: '/admin',
    })
    expect(adminRouting(host, host, '/admin/giris')).toEqual({ action: 'next' })
    expect(adminRouting(host, host, '/api/version')).toEqual({ action: 'next' })
    expect(adminRouting(host, host, '/_next/data/x.json')).toEqual({ action: 'next' })
  })

  it("başka host'tan /admin 404 alır, diğer sayfalar geçer", () => {
    const host = 'ucus-admin.example.com'
    expect(adminRouting(host, 'ucus.example.com', '/admin')).toEqual({ action: 'not_found' })
    expect(adminRouting(host, 'ucus.example.com', '/admin/giris')).toEqual({ action: 'not_found' })
    expect(adminRouting(host, 'ucus.example.com', '/administrator')).toEqual({ action: 'next' })
    expect(adminRouting(host, 'ucus.example.com', '/durum')).toEqual({ action: 'next' })
  })
})
