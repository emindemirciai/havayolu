// Docker HEALTHCHECK: API /health 200 dönerse 0, aksi hâlde 1 ile çıkar (curl'e bağımlı değil).
const port = process.env.API_PORT || '4000'
const response = await fetch(`http://127.0.0.1:${port}/health`, {
  signal: AbortSignal.timeout(2000),
}).catch(() => null)
process.exit(response?.ok ? 0 : 1)
