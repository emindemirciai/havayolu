import { buildApp } from './app'
import { EnvError, loadDotEnvForDevelopment, parseEnv } from './env'

loadDotEnvForDevelopment()

let env
try {
  env = parseEnv(process.env)
} catch (error) {
  if (error instanceof EnvError) {
    console.error(error.message)
    process.exit(1)
  }
  throw error
}

const app = buildApp(env)

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'kapanıyor')
  try {
    await app.close()
    process.exit(0)
  } catch (error) {
    app.log.error(error, 'kapanış sırasında hata')
    process.exit(1)
  }
}
process.once('SIGTERM', () => void shutdown('SIGTERM'))
process.once('SIGINT', () => void shutdown('SIGINT'))

try {
  await app.listen({ host: env.API_LISTEN_HOST, port: env.API_PORT })
} catch (error) {
  app.log.error(error, 'API başlatılamadı')
  process.exit(1)
}
