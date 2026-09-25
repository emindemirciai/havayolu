import { currentVersion } from '@ucus/shared'
import { getServerEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export function GET() {
  const env = getServerEnv()
  return Response.json({
    app: 'ucus-takip',
    version: currentVersion(),
    gitSha: env.GIT_SHA,
    buildTime: env.BUILD_TIME ?? null,
    env: env.APP_ENV,
  })
}
