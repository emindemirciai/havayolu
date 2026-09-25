import { resolveLocale } from '@ucus/i18n'
import type { NextRequest } from 'next/server'
import { LOCALE_COOKIE } from '@/lib/locale'
import { safeNextPath } from '@/lib/safe-path'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/** Dil tercihini çereze yazar ve kullanıcıyı geldiği sayfaya göreli bir yönlendirmeyle geri gönderir. */
export function GET(request: NextRequest) {
  const locale = resolveLocale(request.nextUrl.searchParams.get('to'))
  const next = safeNextPath(request.nextUrl.searchParams.get('next'))
  const secure = process.env.APP_ENV === 'production' ? '; Secure' : ''
  return new Response(null, {
    status: 303,
    headers: {
      Location: next,
      'Set-Cookie': `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax; HttpOnly${secure}`,
      'Cache-Control': 'no-store',
    },
  })
}
