// Docker HEALTHCHECK: worker /health 200 (taze heartbeat) dönerse 0, aksi hâlde 1 ile çıkar.
const port = process.env.WORKER_HEALTH_PORT || '4200'
const response = await fetch(`http://127.0.0.1:${port}/health`, {
  signal: AbortSignal.timeout(2000),
}).catch(() => null)
process.exit(response?.ok ? 0 : 1)
