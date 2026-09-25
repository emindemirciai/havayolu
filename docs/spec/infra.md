# Altyapı ve yayın sözleşmesi

Sunucu: Hostinger **KVM 2** (2 vCPU, 8 GB RAM, 100 GB NVMe). Üzerinde Dokploy çalışır ve **başka canlı projelerle paylaşılır**. 2026-09-25'te bellek kullanımı zaten %52'ydi (~3,8 GB boş). Bu projenin kalıcı bütçesi **≤ 2,6 GB**'tır.

## Bellek bütçesi (varsayılan limitler env'den değiştirilebilir)
| Servis | Limit | Ayar |
|---|---|---|
| `ut-postgres` | 768 MB | `shared_buffers=192MB effective_cache_size=512MB work_mem=4MB maintenance_work_mem=64MB max_connections=40 max_parallel_workers_per_gather=0 wal_compression=on max_wal_size=1GB`, `shm_size: 128mb` |
| `ut-redis-queue` | 192 MB | `maxmemory 128mb`, `maxmemory-policy noeviction`, `appendonly yes`, `appendfsync everysec` |
| `ut-redis-live` | 256 MB | `maxmemory 192mb`, `maxmemory-policy volatile-ttl`, `save ""`, `appendonly no` |
| `ut-web` | 320 MB | `NODE_OPTIONS=--max-old-space-size=224` |
| `ut-api` | 384 MB | `--max-old-space-size=270` |
| `ut-worker-rt` | 384 MB | `WORKER_ROLE=ingest,engine`, `--max-old-space-size=270` |
| `ut-worker-bg` | 256 MB | `WORKER_ROLE=notifier,jobs`, `--max-old-space-size=180` |
| `ut-migrate` | 256 MB | tek seferlik, `restart: "no"` |

- `maxmemory` her zaman konteyner limitinin en fazla %75'idir. api ve worker bağlantı havuzlarının toplamı ≤ 30'dur.
- **KVM 4'e geçiş eşiği:** kalıcı bellek kullanımı %80'in üstünde ya da ingest döngü gecikmesi p95 > hedef × 1,5.
- Host'ta 2 GB swap ve `vm.overcommit_memory=1` önerilir. Bu ayar tüm projeleri etkiler; ACTIVATION'da kullanıcı adımıdır.

## Compose kuralları
- `docker-compose.yml` (üretim):
  - `ut-web`, `ut-api`, `ut-worker-rt`, `ut-worker-bg` ve `ut-migrate` şunu kullanır: `image: ghcr.io/<owner>/ucus-takip-{web|api|worker}:${IMAGE_TAG:-main}` ve `pull_policy: always`.
  - **Hiçbir serviste `build:` yoktur.** CI, `docker compose -f docker-compose.yml config` çıktısında `build:` bulursa kırmızıya döner.
- `docker-compose.build.yml` yerelde imaj derlemek içindir. `docker-compose.dev.yml` altyapıyı sağlar: PostGIS, iki Redis, Mailpit, MinIO. Uygulamalar yerelde `pnpm dev` ile çalışır.
- Servis adları `ut-` önekiyle projeye özgüdür; paylaşılan `dokploy-network` üzerinde ad çakışması olmaz.
- **Traefik etiketi yazılmaz, `dokploy-network` tanımlanmaz.** Domain'ler Dokploy arayüzünden eklenir: `ut-web` → `DOMAIN` (port 3000), `ut-api` → `api.DOMAIN` (port `API_PORT`). Dokploy etiketleri deploy sırasında kendisi ekler. `ports` yerine `expose` kullanılır. Postgres ve Redis dışarı port açmaz.
- Her uygulama servisi `env_file: .env` kullanır; Dokploy'un Environment sekmesi bu dosyayı yazar. `${VAR}` interpolasyonu yalnızca imaj etiketi ve limitler için kullanılır.
- Named volume'lar: `ut_pgdata`, `ut_redisqueue`. Repo içine göreli bind mount yapılmaz; Dokploy her deploy'da yeniden klonlar.
- Hepsinde `restart: unless-stopped` (migrate hariç), `init: true`, `stop_grace_period: 30s` bulunur. `depends_on` sağlık koşuluna bağlıdır. api, web ve worker'lar `ut-migrate`'e `condition: service_completed_successfully` ile bağlıdır.
- Log rotasyonu tüm servislerde uygulanır (x-logging anchor): `json-file`, `max-size: 10m`, `max-file: 5`.
- `HEALTHCHECK` `node healthcheck.js` çalıştırır (curl'e bağımlı değildir). Parametreler: `--interval=5s --start-period=10s --retries=3`. CMD doğrudan `node dist/index.js`'dir (`pnpm start` değil).
- Postgres imajı `postgis/postgis:18-3.6`'dır (Debian; amd64). Dokploy Compose yedekleri `docker exec … pg_dump` kullanır; imajda bash bulunur.

## Dockerfile kuralları
- Çok aşamalı yapı; her Dockerfile `turbo prune <app> --docker` ile başlar. Mobil bağımlılıklar imaja girmez.
- Taban `node:24-slim`. pnpm `npm i -g pnpm@<pin>` ile kurulur (corepack kullanılmaz). Root olmayan kullanıcı kullanılır. Mümkün olan yerde `read_only: true` ve `tmpfs` kullanılır.
- Next.js: `output: 'standalone'`, `outputFileTracingRoot` repo kökünü gösterir. `public/` ve `.next/static` imaja kopyalanır.
- `GIT_SHA` build-arg olarak imaja gömülür (ortama özgü değildir). `/version` uç noktası bunu döndürür.
- Ortama özgü değer build'e gömülmez. Web tarafı yapılandırmayı çalışma zamanında sunucudan okur (Server Component + `connection()` ya da `/api/config`). `NEXT_PUBLIC_*` kullanılmaz.

## Migration
- Üretimde migration'ları yalnızca `ut-migrate` servisi çalıştırır: worker imajı + `node packages/db/dist/migrate.js`. drizzle-orm'un programatik migrator'ı kullanılır. drizzle-kit üretim imajında bulunmaz.
- `pg_advisory_lock` alınır, `lock_timeout=5s` ve `statement_timeout=120s` uygulanır. Hata olursa sıfır olmayan kodla çıkılır ve deploy durur.
- Migration'lar geriye uyumludur (expand → kodu yayınla → sonraki sürümde contract). Sütun silme ya da yeniden adlandırma tek deploy'da yapılmaz. Yıkıcı migration = DUR-SOR.
- Partition DDL'i `packages/db/sql/` altında elle yazılmış, idempotent SQL'dir (`drizzle-kit generate --custom`). `drizzle.config.ts` içinde `extensionsFilters: ['postgis']` ve partition çocuklarını dışlayan `tablesFilter` bulunur.
- migrate her çalışmada partition'ları 7 gün ileriye açar. Bir `DEFAULT` partition bulunur; DEFAULT'a satır düşerse admin uyarısı verilir.
- CI iki migration testi koşar: temiz DB'de baştan sona, ve önceki sürüm şeması üzerine yükseltme.

## CI/CD (tek workflow + çağrılan deploy)
- `.github/workflows/ci.yml` `pull_request` ve `push: main` ile çalışır. `concurrency: {group: ci-${{ github.ref }}, cancel-in-progress: true}`.
  1. `changes`: `dorny/paths-filter@v4`, `predicate-quantifier: 'every'`, filtre `deploy: ['**', '!apps/mobile/**', '!docs/**']`.
  2. Kontroller: `lint`, `typecheck`, `test`, `test:integration` (PostGIS + Redis servis konteynerleri), `build`, `test:e2e` (replay ile), `compose-guard` (`build:` yasağı).
  3. `deploy`: `uses: ./.github/workflows/deploy.yml`, `secrets: inherit`, `needs: [changes, <tüm kontroller>]`. Koşul: `if: github.event_name=='push' && github.ref=='refs/heads/main' && needs.changes.outputs.deploy=='true'`.
- Workflow düzeyinde `paths-ignore` ve `workflow_run` **kullanılmaz**.
- `.github/workflows/deploy.yml` (`on: workflow_call` + `workflow_dispatch`):
  - Ayarlar: `environment: production`, `concurrency: {group: deploy-prod, cancel-in-progress: false}`. İzinler: build işinde `contents: read, packages: write`, deploy işinde `contents: read`.
  - Build: GHCR'a `GITHUB_TOKEN` ile giriş yapılır. 3 imaj `docker/build-push-action` ile derlenir: `linux/amd64`, `cache-from/to: type=gha`, etiketler `sha-<7>` ve `main`.
  - **Deploy sözleşmesi:**
    1. `POST $DOKPLOY_URL/api/compose.deploy` çağrılır. Başlıklar: `x-api-key: $DOKPLOY_API_TOKEN`, `Content-Type: application/json`. Gövde: `{"composeId":"$DOKPLOY_COMPOSE_ID","title":"gh-<sha7>-<run_id>"}`.
    2. **`freshVolumes` asla gönderilmez** (volume'ları siler); bunu doğrulayan bir script testi bulunur. `compose.redeploy` kullanılmaz.
    3. Çağrı asenkrondur ("Deployment queued"). `GET $DOKPLOY_URL/api/deployment.allByCompose?composeId=…` 10 sn arayla en fazla 15 dk yoklanır. Kuyrukta bekleme süresine izin verilir. Git kaynaklı deploy'da Dokploy başlığı commit mesajıyla değiştirir; eşleşme `createdAt` > tetikleme zamanı ya da `description` içindeki SHA ile yapılır. `error` ya da `cancelled` → kırmızı. `errorMessage` çoğu zaman boştur.
    4. Ardından `https://api.DOMAIN/version` ve `https://DOMAIN/api/version` yeni `GIT_SHA`'yı döndürene ve `/ready` 200 verene kadar yoklanır. Olmazsa iş kırmızıya döner.
  - Action sürümleri (node24): `actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`, `docker/setup-buildx-action@v4`, `docker/login-action@v4`, `docker/metadata-action@v6`, `docker/build-push-action@v7`, `dorny/paths-filter@v4`. Üçüncü taraf action'lar commit SHA ile sabitlenir.
- `rollback.yml` (`workflow_dispatch`, girdi `sha`): seçilen `sha-…` imajlarını `docker buildx imagetools create` ile `:main` olarak yeniden etiketler, ardından aynı deploy ve doğrulama adımlarını çalıştırır.
- GitHub secrets: `DOKPLOY_URL` (HTTPS panel adresi; `http://IP:3000` değil), `DOKPLOY_API_TOKEN`, `DOKPLOY_COMPOSE_ID`. Ayrıca `environment: production` tanımlanır.
- **Secrets henüz tanımlı değilse** (kullanıcı Dokploy kurulumunu bitirmediyse) deploy adımı `::notice::` ile **atlanır ve iş yeşil kalır.** İmajlar yine GHCR'a gönderilir. Secrets tanımlıyken deploy başarısız olursa iş kırmızıya döner. Kullanıcının kuralı: "Dokploy'da ve GitHub CI'da hata istemiyorum."

## Yayın davranışı ve kesinti
- Compose deploy'u **sıfır kesintili değildir.** web ve api için birkaç saniyelik kesinti kabul edilir ve DEPLOY_DOKPLOY.md'de açıkça yazılır.
- SIGTERM gelince:
  - API yeni WS kabul etmez. İstemcilere `{type:'reconnect', afterMs: 1000–10000 rastgele}` gönderir ve bağlantıları 1012 koduyla kapatır.
  - Worker `worker.close()` çağırır, motor durumunu `redis-queue`'ya yazar ve açık ingest turunu bitirir.
- İstemciler 1–10 sn jitter ve üstel geri çekilmeyle yeniden bağlanır.

## Gözlem ve uyarı (KVM 2'de Prometheus/Grafana çalıştırılmaz)
- Dış uptime kontrolü dakikada bir `https://DOMAIN` ve `https://api.DOMAIN/ready` adreslerine yapılır (ör. UptimeRobot / Better Stack; ACTIVATION).
- Dead-man's-switch ping'leri `HEARTBEAT_URL_INGEST`, `HEARTBEAT_URL_NOTIFIER` ve `BACKUP_HEARTBEAT_URL` adreslerine gider. Env yoksa özellik kapalıdır.
- Worker'daki uyarı job'ı ADMIN_EMAIL'e e-posta atar (aynı uyarı saatte en fazla bir kez). Tetikleyiciler:
  - sağlayıcı tazeliği 5 dk boyunca > 60 sn
  - 429 oranı > %20
  - 401/403 alınması
  - Redis belleği > %80
  - disk > %75
  - bildirim kuyruğu gecikmesi > 30 sn
  - DEFAULT partition'a satır düşmesi
- `/metrics` (Prometheus formatı) yalnızca token ile erişilebilir.
- Dokploy Notifications: Build Error ve DB Backup olayları Telegram ya da e-posta ile bildirilir.

## Yedekleme (Parça 2B'de kurulur)
- Dokploy Compose **Backups** sekmesi kullanılır: servis `ut-postgres`, günlük cron, `keepLatest ≥ 7`. Hedef Hostinger dışında S3 uyumlu bir depodur (Backblaze B2 ya da Cloudflare R2).
- İz tabloları dökümü şişirir. Bu yüzden iki katman vardır:
  1. Günlük `pg_dump -Fc --exclude-table-data='track_points_*'`.
  2. Günü kapanan partition'lar bir kez `COPY … | zstd` ile yüklenir ve 30 gün tutulur.
- S3 tanımlı değilse yerelde en fazla 2 kopya tutulur. Disk %70'in üstündeyse yerel yedek yazılmaz ve admin panelinde kırmızı uyarı gösterilir.
- Dokploy Volume Backup, çalışan Postgres için **kullanılmaz** (tutarsız kopya riski).
- `scripts/restore.sh` (konteyner içinde çalışır) Dokploy'un `pg_dump -Fc | gzip` biçimini kabul eder. CI'da geri yükleme testi koşar.
- Hedefler: RPO 24 saat (iz verisi hariç), RTO 1 saat. Ayda bir geri yükleme provası yapılır.
- Yeniden üretilemeyen sırlar (VAPID özel anahtarı, JWT imza anahtarı, Dokploy env dökümü) parola yöneticisinde tutulur. **VAPID anahtarı kaybolursa tüm web push abonelikleri geçersiz olur.**

## Güvenlik
- Dokploy ≥ v0.30.7 kullanılır; eski sürümlerde komut enjeksiyonu açıkları vardır.
- Panel HTTPS domain'e bağlanır ve 3000 portu kapatılır. ufw yalnızca 22, 80 ve 443'e izin verir.
- Let's Encrypt e-postası Web Server ayarlarında girilir (varsayılan `test@localhost.com`'dur).
- Deploy API anahtarı mümkünse yalnızca bu projeye erişimi olan bir "deploy-bot" üyesiyle üretilir. Süresi 90 gündür.
- GHCR çekme kimliği classic PAT'tir, yalnızca `read:packages` yetkisiyle.
- Fastify `trustProxy` yalnızca `TRUSTED_PROXY_CIDRS`'e (Traefik ağı) güvenir. Cloudflare önde ise `EDGE_PROXY=cloudflare` açılır ve `CF-Connecting-IP` kullanılır.
- pino `redact` ayarıyla authorization, cookie, `*.token` ve `*.password` alanları loglanmaz.
