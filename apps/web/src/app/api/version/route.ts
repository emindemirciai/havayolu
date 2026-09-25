import { currentVersion } from '@havayolu/shared'
import { getServerEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export function GET() {
  const env = getServerEnv()
  return Response.json({
    app: 'havayolu',
    version: currentVersion(),
    gitSha: env.GIT_SHA,
    buildTime: env.BUILD_TIME ?? null,
    env: env.APP_ENV,
  })
}
