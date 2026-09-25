import { NextResponse, type NextRequest } from 'next/server'
import { adminRouting, canonicalHostRedirect } from '@/lib/admin-host'

/** www → kök alan adı ve admin alan adı ayrımı (bkz. lib/admin-host.ts). Node.js çalışma zamanı. */
export function proxy(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const canonical = canonicalHostRedirect(
    process.env.WEB_HOST,
    host,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  )
  if (canonical) return new NextResponse(null, { status: 308, headers: { Location: canonical } })
  const decision = adminRouting(process.env.ADMIN_HOST, host, request.nextUrl.pathname)
  switch (decision.action) {
    case 'redirect':
      return new NextResponse(null, { status: 307, headers: { Location: decision.location } })
    case 'not_found':
      return new NextResponse(null, { status: 404 })
    default:
      return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
