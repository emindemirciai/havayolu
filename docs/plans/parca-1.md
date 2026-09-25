# Parça 1 planı — canlı ilerleme dosyası

Kaynak: `docs/prompts/parca-1.md`. Her kilometre taşı ayrı dal ve PR'dır. Durum: `[ ]` bekliyor, `[~]` sürüyor, `[x]` tamam.

| # | Kilometre taşı | Dal | Durum | Son commit |
|---|---|---|---|---|
| M0 | Repo iskeleti | `p1/m0-skeleton` | [ ] | — |
| M1 | Yayın iskeleti (GHCR + Dokploy) | `p1/m1-deploy` | [ ] | — |
| M2 | Veritabanı ve referans verisi | `p1/m2-db` | [ ] | — |
| M3 | Sağlayıcılar | `p1/m3-providers` | [ ] | — |
| M4 | Ingest | `p1/m4-ingest` | [ ] | — |
| M5 | Canlı API | `p1/m5-live-api` | [ ] | — |
| M6 | Web canlı harita | `p1/m6-map` | [ ] | — |
| M7 | Dev araçları, canlı duman testi, kapsama ölçümü | `p1/m7-tools` | [ ] | — |

## M0 — Repo iskeleti
**Dokunulacak dizinler:**
- kök yapılandırma: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc`, `.editorconfig`, `.nvmrc`, `.env.example`
- `packages/{shared,i18n,geo,engine,providers,db}`
- `apps/{web,api,worker}`
- `scripts/`
- `.github/workflows/ci.yml`

**Kabul komutları:**
- `pnpm install --frozen-lockfile`
- `pnpm ci:local` (lint + typecheck + test + build)
- `git ls-files --eol` içinde `w/crlf` yok

**Notlar:** TypeScript 6.0.x'e pinlenir. typescript-eslint 8.70 `typescript <6.1` istiyor; TS 7 (native) henüz desteklenmiyor (DECISIONS D-021).

**Çıktı kaydı:** (kilometre taşı bitince buraya komut çıktıları eklenir)

## M1 — Yayın iskeleti
**Kabul:** `docs/prompts/parca-1.md` → M1. **DUR:** PR birleşmeden önce kullanıcı `docs/DEPLOY_DOKPLOY.md` adımlarını uygular.

## M2–M7
Ayrıntılar `docs/prompts/parca-1.md`'dedir. Her kilometre taşına başlarken bu dosyaya dizinler ve kabul komutları eklenir.
