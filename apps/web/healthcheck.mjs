// Docker HEALTHCHECK: web /api/version 200 dönerse 0, aksi hâlde 1 ile çıkar.
const port = process.env.PORT || '3000'
const response = await fetch(`http://127.0.0.1:${port}/api/version`, {
  signal: AbortSignal.timeout(2000),
}).catch(() => null)
process.exit(response?.ok ? 0 : 1)
