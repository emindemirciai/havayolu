# Parça 1 planı — canlı ilerleme dosyası

Kaynak: `docs/prompts/parca-1.md`. Her kilometre taşı ayrı dal ve PR'dır.

Onay: 2026-09-25 (kullanıcı: "Proje + Parça 1'e başla")

Durumlar: `[ ]` başlamadı, `[~]` sürüyor, `[k]` kod bitti ve kullanıcı doğrulaması bekliyor, `[x]` tamam.

| # | Kilometre taşı | Dal | Durum | Birleşen PR |
|---|---|---|---|---|
| M0 | Repo iskeleti, yerel test ortamı, Durum ve Yenilikler | `p1/m0-skeleton` | [k] kod bitti; repo oluşturulunca push + PR + birleştirme | — |
| M1a | İmajlar, bütün servisler, yönetici oturumu, admin Servisler paneli | `p1/m1a-images` | [ ] | — |
| M1b | Yayın hattı (CI, deploy, rollback, DEPLOY_DOKPLOY.md) | `p1/m1b-deploy` | [ ] | — |
| M2 | Veritabanı ve referans verisi | `p1/m2-db` | [ ] | — |
| M3 | Sağlayıcılar | `p1/m3-providers` | [ ] | — |
| M4 | Ingest, replay ve senaryo araçları | `p1/m4-ingest` | [ ] | — |
| M5 | Canlı API | `p1/m5-live-api` | [ ] | — |
| M6 | Web canlı harita | `p1/m6-map` | [ ] | — |
| M7 | Canlı araçlar ve kapsama raporu | `p1/m7-tools` | [ ] | — |

## M0 — Repo iskeleti ve yerel test ortamı
**Dizinler:**
- kök yapılandırma
- `packages/{shared,i18n,geo,providers}`
- `apps/{web,api}`
- `scripts/`
- `.github/workflows/ci.yml`
- `.claude/launch.json`
- `.env.example`
- `LICENSE`

**Kabul komutları:**
- `pnpm install --frozen-lockfile`
- `pnpm ci:local`
- `pnpm check:eol`
- `pnpm changelog:check`
- `pnpm stats`
- `pnpm backup`
- `pnpm dev` → `http://localhost:3100/durum` API'yi "Çalışıyor" gösterir; `/yenilikler` açılır; TR/EN geçişi çalışır

**Notlar:**
- TypeScript 6.0.x'e sabitlendi (D-021).
- `engine` ve `db` paketleri ilk kullanıldıkları kilometre taşında oluşturulur.

**Çıktı kaydı (2026-09-25):**
- `pnpm install` → 258 paket, pnpm 12.6.0. turbo 2.11.3 ve vitest 5.0.1'e sabitlendi (2.11.4 ve 5.0.2 24 saatten yeni; `minimumReleaseAge` istisnası eklenmedi).
- `pnpm ci:local` → format ✓, EOL ✓, changelog v0.2.0 ✓, scripts typecheck ✓. turbo: 20/20 görev başarılı (lint 6, typecheck 6, test 6 paket / 27 test, build 2).
- `pnpm dev` → web :3100, api :4100. `/durum` 200, API "Çalışıyor", `/version` `{app:"ucus-takip",version:"0.2.0"}`; `/dil?to=en` → `/yenilikler` İngilizce; konsol hatası yok.
- `pnpm stats` → 90 dosya, 4.828 satır (2.062 kod).

## M1a–M7
Ayrıntılar `docs/prompts/parca-1.md`'dedir. Her kilometre taşına başlarken bu dosyaya dizinler ve kabul komutları eklenir.
