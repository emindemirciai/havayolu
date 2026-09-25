# Altyapı ve yayın sözleşmesi

Sunucu: Hostinger **KVM 2** (2 vCPU, 8 GB RAM, 100 GB NVMe). Üzerinde Dokploy çalışır ve **başka canlı projelerle paylaşılır**. 2026-09-25'te bellek kullanımı zaten %52'ydi (~3,8 GB boş). Bu projenin kalıcı bütçesi **≈ 2,6 GB**'tır. Bütçe tam kullanıldığında host ≈ %84 dolu olur.

## Bellek bütçesi (limitler env'den değiştirilebilir)
| Servis | Limit | Ayar |
|---|---|---|
| `ut-postgres` | 768 MB | `shared_buffers=192MB effective_cache_size=512MB work_mem=4MB maintenance_work_mem=64MB max_connections=40 max_parallel_workers_per_gather=0 wal_compression=on max_wal_size=1GB`, `shm_size: 128mb` |
| `ut-redis-queue` | 256 MB | `maxmemory 128mb`, `maxmemory-policy noeviction`, `appendonly yes`, `appendfsync everysec` (AOF yeniden yazımında bellek 2 katına çıkabilir; limit ≥ 2 × maxmemory) |
| `ut-redis-live` | 256 MB | `maxmemory 192mb`, `maxmemory-policy volatile-ttl`, `save ""`, `appendonly no` |
| `ut-web` | 320 MB | `NODE_OPTIONS=--max-old-space-size=224` |
| `ut-api` | 384 MB | `--max-old-space-size=270` |
| `ut-worker-rt` | 384 MB | `WORKER_ROLE=ingest,engine`, `--max-old-space-size=270` |
| `ut-worker-bg` | 256 MB | `WORKER_ROLE=notifier,jobs`, `--max-old-space-size=180`; yedek job'ı burada çalışır |
| `ut-migrate` | 256 MB | tek seferlik, `restart: "no"` |

- Kalıcı toplam 2.624 MB'tır (migrate hariç). Redis'te `maxmemory-policy noeviction` altında da TTL'li anahtarlar süresi dolunca silinir. BullMQ Worker bağlantıları `maxRetriesPerRequest: null` kullanır. api ve worker bağlantı havuzlarının toplamı ≤ 30'dur.
- **KVM 4'e geçiş eşiği** (herhangi biri):
  - bu projenin konteynerlerinin toplam RSS'i 7 gün boyunca bütçenin %90'ını aşar
  - host'ta kullanılabilir bellek 15 dk boyunca < 600 MB kalır
  - birincil istasyon tazeliği p95 > 30 sn

  Host yüzdesi tek başına tetikleyici değildir.
- Host'ta 2 GB swap ve `vm.overcommit_memory=1` önerilir. Bu ayar tüm projeleri etkiler; ACTIVATION'da kullanıcı adımıdır.

## Compose kuralları
- **`docker-compose.yml` (üretim):**
  - Uygulama servisleri (`ut-web`, `ut-api`, `ut-worker-rt`, `ut-worker-bg`, `ut-migrate`) şunu kullanır: `image: ghcr.io/emindemirciai/ucus-takip-{web|api|worker}:${IMAGE_TAG:-main}` ve `pull_policy: always`.
  - **Hiçbir serviste `build:` yoktur.** CI'daki `compose-guard` işi `docker compose -f docker-compose.yml config` çıktısında `build:` bulursa kırmızıya döner.
  - Owner her yerde küçük harfle yazılır; workflow'larda `github.repository_owner` küçük harfe çevrilir.
- **Diğer compose dosyaları:**
  - `docker-compose.build.yml` yerelde imaj derlemek içindir: her uygulama servisine `build:` ve `pull_policy: build` ekler.
  - `docker-compose.dev.yml` altyapıyı sağlar: PostGIS, iki Redis, Mailpit, MinIO; yerel portları CLAUDE.md'dekilerdir. Uygulamalar yerelde `pnpm dev` ile çalışır.
- **Adlar ve ağ:**
  - Servis adları `ut-` önekiyle projeye özgüdür; paylaşılan `dokploy-network`'te ad çakışması olmaz.
  - **Traefik etiketi yazılmaz, `dokploy-network` tanımlanmaz.** Domain'ler Dokploy arayüzünden eklenir (`ut-web` → `WEB_HOST` port 3000, `ut-api` → `API_HOST` port 4000); etiketleri Dokploy ekler.
  - `ports` yerine `expose` kullanılır. Postgres ve Redis dışarı port açmaz.
- **Env:**
  - Her uygulama servisi `env_file: [{path: .env, required: false}]` kullanır; eksik değişkeni zod açılışta yakalar. Böylece CI'daki `docker compose config` `.env` olmadan çalışır.
  - Dokploy Compose'da "Create env file" anahtarı açık kalır (v0.30.0+). `${VAR}` interpolasyonu yalnızca imaj etiketi ve limitler için kullanılır.
- **Volume'lar:**
  - `ut_pgdata:/var/lib/postgresql` bağlanır. PG 18+ imajında PGDATA `/var/lib/postgresql/18/docker`'dır; `/var/lib/postgresql/data` **kullanılmaz**.
  - `ut_redisqueue` ayrı bir volume'dur.
  - Repo içine göreli bind mount yapılmaz (Dokploy her deploy'da yeniden klonlar).
- **Çalışma ayarları:**
  - Tüm servislerde `init: true`, `stop_grace_period: 30s` ve `restart: unless-stopped` (migrate hariç) bulunur.
  - `depends_on` sağlık koşuluna bağlıdır. api, web ve worker'lar `ut-migrate`'e `condition: service_completed_successfully` ile bağlıdır.
  - Log rotasyonu tüm servislerde uygulanır (x-logging anchor): `json-file`, `max-size: 10m`, `max-file: 5`.
- **Sağlık kontrolü:** `HEALTHCHECK` `node healthcheck.js` çalıştırır (curl'e bağımlı değildir); `--interval=5s --start-period=10s --retries=3`. CMD doğrudan `node …`'dır (`pnpm start` değil).

## Dockerfile kuralları
- **Genel:**
  - Çok aşamalı yapı; her Dockerfile `turbo prune <app> --docker` ile başlar. Mobil bağımlılıklar imaja girmez.
  - Taban `node:24-slim`. pnpm `npm i -g pnpm@<pin>` ile kurulur (corepack yok).
  - Root olmayan kullanıcı kullanılır. Mümkün olan yerde `read_only: true` + `tmpfs` kullanılır.
- **Worker imajı:** PGDG deposundan `postgresql-client-18` içerir (`pg_dump` sürümü sunucuyla aynı olmalıdır) ve `scripts/restore.sh`'i taşır.
- **Web imajı:** Next.js `output: 'standalone'`, `outputFileTracingRoot` repo kökünü gösterir. `public/` ve `.next/static` imaja kopyalanır.
- **Sürüm bilgisi:** `GIT_SHA` ve `BUILD_TIME` build-arg olarak imaja gömülür (ortama özgü değildir). `/version` ve `/api/version` bunları döndürür.
- **Ortama özgü değerler** build'e gömülmez. Web tarafı yapılandırmayı çalışma zamanında sunucudan okur; `NEXT_PUBLIC_*` kullanılmaz.

## Migration
- **Kim çalıştırır:** Üretimde migration'ları yalnızca `ut-migrate` çalıştırır (worker imajı + `node packages/db/dist/migrate.js`). drizzle-orm'un programatik migrator'ı kullanılır; drizzle-kit üretim imajında yoktur.
- **Güvenlik ayarları:** `pg_advisory_lock` alınır, `lock_timeout=5s` ve `statement_timeout=120s` uygulanır. Hata olursa sıfır olmayan kodla çıkılır ve deploy durur.
- **İlk migration:** `packages/db`'nin ilk migration'ı `CREATE EXTENSION IF NOT EXISTS postgis;`'tir (Parça 1 M1a).
- **Uyumluluk:** Migration'lar geriye uyumludur (expand → kodu yayınla → sonraki sürümde contract). Sütun silme ya da yeniden adlandırma tek deploy'da yapılmaz; yıkıcı migration DUR-SOR gerektirir.
- **Partition'lı tablolar:**
  - `track_points_sampled` ve `track_points_fine` parent tabloları tip güvenliği için Drizzle şemasında `pgTable` olarak tanımlanır.
  - `drizzle-kit generate`'in ürettiği `CREATE TABLE` SQL'i elle düzenlenerek `PARTITION BY RANGE (ts)` eklenir. Snapshot tabloyu içerdiği için sonraki `generate` boş fark verir.
  - Partition çocukları, DEFAULT partition ve bakım DDL'i şemada yer almaz; `packages/db/sql/` altında idempotent SQL olarak (`drizzle-kit generate --custom`) eklenir.
  - `drizzle-kit push` ve `pull` bu projede **kullanılmaz** (`pull` partitioned parent'ları düşürür, drizzle-orm #6093). `tablesFilter` ve `extensionsFilters` yalnızca push/pull'u etkiler.
- **Partition bakımı:**
  - migrate ve günlük job partition'ları 7 gün ileriye açar.
  - Bir DEFAULT partition bulunur ve her zaman boş tutulur; DEFAULT'a satır düşerse admin uyarısı verilir.
  - DEFAULT varken `DETACH … CONCURRENTLY` kullanılamaz. Süresi dolan partition'lar gece, `lock_timeout=5s` ile `DETACH PARTITION` (CONCURRENTLY olmadan) + `DROP TABLE` komutlarıyla silinir. Kilit alınamazsa jitter'lı yeniden deneme yapılır.
- **CI testleri:** Temiz DB'de baştan sona migration. Yükseltme testi: `origin/main`'deki migration'lar temiz DB'ye, üstüne dalın migration'ları uygulanır; main'de migration yoksa iş başarılı sayılır.

## CI/CD (özel repo, GitHub Free)
**Kısıtlar**
- Özel repo + Free planda **dal koruması ve environment yoktur.** Secrets repo düzeyinde tutulur (Settings → Secrets and variables → Actions); `environment:` satırı kullanılmaz.
- Actions ayda 2.000 dk ile sınırlıdır. Bu yüzden:
  - PR çalışmaları iptal edilebilir
  - imajlar yalnızca `main`'de derlenir
  - e2e yalnızca ilgili dosyalar değişince çalışır

**`.github/workflows/ci.yml`** (`pull_request` ve `push: main`)
- `concurrency: {group: ci-${{ github.ref }}, cancel-in-progress: ${{ github.event_name == 'pull_request' }}}`. `main` çalışmaları iptal edilmez; aksi hâlde çağrılan deploy işi yarıda kesilir.
- İşler:
  1. `changes`: `dorny/paths-filter@v4`, `predicate-quantifier: 'every'`. Filtreler: `deploy: ['**', '!apps/mobile/**', '!docs/**']` ve e2e için web/api/worker/packages.
  2. `checks`: format, lint, typecheck, unit test, build, `changelog:check`, `check:eol`.
  3. `test-integration`: PostGIS ve Redis servis konteynerleri; ilgili testler eklendikçe açılır.
  4. `e2e`: Playwright; ilgili testler eklendikçe açılır.
  5. `compose-guard` ve `actionlint`.
  6. `deploy`: `uses: ./.github/workflows/deploy.yml`, `secrets: inherit`, `permissions: {contents: read, packages: write}` (çağrılan workflow izin yükseltemez), `needs: [changes, …tüm kontroller]`. Koşul: `if: github.event_name=='push' && github.ref=='refs/heads/main' && needs.changes.outputs.deploy=='true'`.
- Workflow düzeyinde `paths-ignore` ve `workflow_run` kullanılmaz.

**`.github/workflows/deploy.yml`** (`on: workflow_call` + `workflow_dispatch` [girdi `dry_run`, varsayılan `true`])
- `concurrency: {group: deploy-prod, cancel-in-progress: false}`.
- **Build:** GHCR'a `GITHUB_TOKEN` ile giriş yapılır. 3 imaj `docker/build-push-action` ile derlenir: `linux/amd64`, `cache-from/to: type=gha`, etiketler `sha-<7>` ve `main`.
- **Deploy koşulu:** `vars.DEPLOY_ENABLED == 'true'` ve secrets tanımlı değilse deploy adımı atlanır.
  - İş yeşil kalır, iş özetine (`$GITHUB_STEP_SUMMARY`) "YAYINLANMADI: Dokploy kurulumu tamamlanmadı" yazılır.
  - Kurulum bitince kullanıcı `DEPLOY_ENABLED=true` yapar. Secrets tanımlıyken deploy başarısız olursa iş kırmızıya döner.
- **Deploy sözleşmesi** (`scripts/deploy-dokploy.mts`):
  1. Tetiklemeden önce `GET $DOKPLOY_URL/api/deployment.allByCompose?composeId=…` ile mevcut deployment id'leri kaydedilir.
  2. `POST $DOKPLOY_URL/api/compose.deploy` çağrılır. Başlıklar: `x-api-key: $DOKPLOY_API_TOKEN`, `Content-Type: application/json`. Gövde: `{"composeId":"…","title":"gh-<sha7>-<run_id>"}`.
  3. **`freshVolumes` asla gönderilmez** (volume'ları siler); bunu doğrulayan bir unit test vardır. `compose.redeploy` kullanılmaz.
  4. Çağrı asenkrondur ("Deployment queued"). Listede ilk görünen yeni id 10 sn arayla en fazla 15 dk izlenir; kuyrukta bekleme süresine izin verilir.
     - Dokploy son 10 kaydı tutar.
     - Başlık commit mesajıyla, `description` klonlama anındaki HEAD'in `Commit: <SHA>` değeriyle değişir; yalnızca bilgi olarak loglanır.
     - `error` ya da `cancelled` → çıkış 1. `errorMessage` çoğu zaman boştur.
  5. Ardından `${API_URL}/version` ve `${WEB_URL}/api/version` yeni `GIT_SHA`'yı döndürene ve `/ready` 200 verene kadar yoklanır. Olmazsa çıkış 1.
  6. Hata yolları (error, eski SHA, 503) stub Dokploy + stub `/version` sunucusuna karşı sahte saatle test edilir. Üretimde bilerek bozuk imaj yayınlanmaz.
- **GitHub secrets:** `DOKPLOY_URL` (HTTPS panel adresi; `http://IP:3000` değil), `DOKPLOY_API_TOKEN`, `DOKPLOY_COMPOSE_ID`. **GitHub variables:** `WEB_URL`, `API_URL`, `DEPLOY_ENABLED`.
- **Action sürümleri (node24):** `actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`, `docker/setup-buildx-action@v4`, `docker/login-action@v4`, `docker/metadata-action@v6`, `docker/build-push-action@v7`, `dorny/paths-filter@v4`. Üçüncü taraf action'lar commit SHA ile sabitlenir.

**`rollback.yml`** (`workflow_dispatch`, girdi `sha`): seçilen `sha-…` imajlarını `docker buildx imagetools create` ile `:main` olarak yeniden etiketler, ardından aynı deploy ve doğrulama adımlarını çalıştırır.

## Yayın davranışı ve kesinti
- Compose deploy'u **sıfır kesintili değildir.** web ve api için birkaç saniyelik kesinti kabul edilir ve DEPLOY_DOKPLOY.md'de açıkça yazılır.
- **SIGTERM davranışı:**
  - API yeni WS kabul etmez. İstemcilere `{type:'reconnect', afterMs: 1000–10000 rastgele}` gönderir ve bağlantıları 1012 koduyla kapatır.
  - Worker `worker.close()` çağırır, motor durumunu `redis-queue`'ya yazar ve açık ingest turunu bitirir.
- İstemciler 1–10 sn jitter ve üstel geri çekilmeyle yeniden bağlanır ve son `seq`'i gönderir.

## Analiz (kullanıcının kendi uygulaması)
- **Uygulama:** Ziyaretçi analizi için kullanıcının MIT lisanslı "Siteni Analiz Et" uygulaması kullanılır (`emindemirciai/Analyze.Your.Site-Siteni-Analiz-Et-`). Bu projenin compose'una girmez; ayrı bir Dokploy Compose uygulamasıdır. Bellek kullanımı ~150–250 MB'tır; host bütçesine eklenir, bu projenin 2,6 GB'ına dahil değildir.
- **Yönetici girişi (platform-admin sözleşmesi):** Analiz paneli girişi bizim API'mizle doğrular. API'nin karşılaması gerekenler (analiz uygulamasının `src/lib/platformAuth.ts` dosyasına göre):
  - `POST /api/auth/login`: gövde `{email, password}`; yanıt `{token}`. `accessToken` ya da `access_token` alanları ve `data`/`user` içine gömülü hâller de kabul edilir, ama biz `token` döndürürüz. Hata yanıtı `{message}` taşır.
  - `GET /api/admin/session`: `Authorization: Bearer <token>`. 200 = yetkili, 401/403 = değil. 404/405 dönerse panel `/api/auth/me`'ye geçer.
  - `GET /api/auth/me`: `{user: {email, role}}`; `role` `ADMIN` olmalıdır.
  - Panel token'ı 7 gün çerezde tutar ve her istekte doğrular. Bu yüzden token 7 gün geçerli, opak ve iptal edilebilirdir (`redis-queue`'da hash'li).
- **Takip script'i:** `<script defer src="${ANALYTICS_URL}/api/tracker" data-site="${ANALYTICS_SITE_ID}">`. Script `localStorage` (kalıcı ziyaretçi kimliği) ve `sessionStorage` kullanır. Bu yüzden web onu **yalnızca kullanıcı onay verdikten sonra** yükler (KVKK Çerez Rehberi; hukuki inceleme ACTIVATION'da).
- **Konum sorgusu:** `ANALYZE_GEO_LOOKUP=false` önerilir. Açıkken ziyaretçi IP'leri `ipwho.is` ve `ip-api.com`'a gönderilir; ip-api'nin ücretsiz katmanı ticari kullanıma kapalıdır ve HTTP kullanır.

## Gözlem ve uyarı (KVM 2'de Prometheus/Grafana çalıştırılmaz)
- **Uptime:** Dış bir uptime kontrolü dakikada bir `${WEB_URL}` ve `${API_URL}/ready` adreslerine yapılır (ör. UptimeRobot; ACTIVATION).
- **Heartbeat:** Dead-man's-switch ping'leri `HEARTBEAT_URL_INGEST`, `HEARTBEAT_URL_NOTIFIER` ve `HEARTBEAT_URL_BACKUP` adreslerine gider. Env yoksa özellik kapalıdır.
- **E-posta uyarıları:** Worker'daki uyarı job'ı ADMIN_EMAIL'e e-posta atar (aynı uyarı saatte en fazla bir kez). Tetikleyiciler:
  - sağlayıcı tazeliği 5 dk boyunca > 60 sn
  - 429 oranı > %20
  - 401/403
  - Redis belleği > %80
  - disk > %70
  - bildirim kuyruğu gecikmesi > 30 sn
  - DEFAULT partition'a satır düşmesi
- **Metrikler:** `/metrics` (Prometheus formatı) yalnızca token ile erişilebilir.
- **Dokploy bildirimleri:** Build Error ve Dokploy Restart olayları Telegram ya da e-posta ile iletilir.

## Yedekleme (Parça 2 M9'da kurulur)
- **Dokploy Compose Backups sekmesi bu projede kullanılmaz:** v0.30.7'de komutu sabittir (`pg_dump -Fc --no-acl --no-owner … | gzip`), tablo dışlayamaz ve yalnızca S3 hedefi kabul eder. Dokploy Volume Backup da çalışan Postgres için kullanılmaz.
- **Günlük yedek** `ut-worker-bg` (`jobs` rolü) içinde, 02:30 UTC'de alınır:
  - komut: `pg_dump -Fc --exclude-table-data='track_points_*'`
  - hedef: Hostinger dışındaki S3 uyumlu depo (`BACKUP_S3_*`; Backblaze B2 ya da Cloudflare R2); en az 7 günlük + 4 haftalık kopya
  - sonuç `backup_runs` tablosuna yazılır (admin "yedek durumu" buradan okunur) ve `HEARTBEAT_URL_BACKUP`'a ping atılır
- **İz tabloları yedeğe girmez.** v1'de iz verisi kaybı kabul edilir; partition arşivi yoktur.
- **S3 tanımlı değilse:** yerelde en fazla 2 kopya tutulur. Disk %70'in üstündeyse yerel yedek yazılmaz ve admin panelinde kırmızı uyarı gösterilir.
- **Geri yükleme:** `scripts/restore.sh` worker imajındadır ve `docker exec ut-worker-bg /app/scripts/restore.sh <dosya>` ile çalışır. CI'da geri yükleme testi koşar.
- **Hedefler:** RPO 24 saat (iz verisi hariç), RTO 1 saat. Ayda bir geri yükleme provası yapılır.
- **Sırlar:** Yeniden üretilemeyen sırlar (VAPID özel anahtarı, JWT imza anahtarı, `ADMIN_SETUP_TOKEN`, Dokploy env dökümü) parola yöneticisinde tutulur. **VAPID anahtarı kaybolursa tüm web push abonelikleri geçersiz olur.**

## Güvenlik
- **Dokploy sürümü:** ≥ v0.30.7; eski sürümlerde komut enjeksiyonu açıkları vardır.
- **Panel ve port 3000:**
  - Panel HTTPS domain'e bağlanır ve 3000 portu dışarıya kapatılır.
  - Docker yayınladığı portlar için iptables kurallarını ufw'nin önüne eklediğinden ufw tek başına yetmez; `ufw-docker` kurulur. ufw'de yalnızca 22, 80 ve 443 açıktır.
  - Doğrulama: başka bir ağdan `curl -m 5 http://<VPS_IP>:3000` zaman aşımına uğramalıdır.
- **Let's Encrypt e-postası** Web Server ayarlarında girilir (varsayılan `test@localhost.com`'dur). Cloudflare proxy kullanılırsa SSL modu "Full (Strict)" olur ve `EDGE_PROXY=cloudflare` girilir.
- **Deploy API anahtarı:**
  - Mümkünse yalnızca bu projeye erişimi olan bir "deploy-bot" üyesiyle, 90 gün süreli üretilir.
  - Doğrulama: anahtarla başka bir projenin compose'unu okumayı dene; 401/403 beklenir. 200 dönerse DUR-SOR.
  - Bitiş tarihi ACTIVATION'a yazılır.
- **GHCR çekme kimliği:** classic PAT, yalnızca `read:packages` yetkisiyle.
- **Proxy güveni:** Fastify `trustProxy` yalnızca `TRUSTED_PROXY_CIDRS`'e (Traefik ağı) güvenir. Cloudflare önde ise `CF-Connecting-IP` kullanılır.
- **Log gizliliği:** pino `redact` ayarıyla authorization, cookie, `*.token` ve `*.password` alanları loglanmaz.
