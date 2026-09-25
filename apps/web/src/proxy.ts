import { NextResponse, type NextRequest } from 'next/server'
import { adminRouting } from '@/lib/admin-host'

/** Admin alan adı ayrımı (bkz. lib/admin-host.ts). Proxy Node.js çalışma zamanında çalışır. */
export function proxy(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
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
