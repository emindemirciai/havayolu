# Parça 1 — Yayın hattı, canlı veri ve harita

**Başlatma:** Claude Code'da `@docs/prompts/parca-1.md dosyasındaki Parça 1'e başla` yaz.
**Önce oku:** `docs/spec/infra.md`, `docs/spec/data-sources.md`, `docs/spec/domain.md` (birimler ve uçuş örneği). CLAUDE.md zaten yüklüdür.

## Hedef
1. Kullanıcı yerelde düzenleyip PR açar, PR'ı `main`'e birleştirir. CI yeşilse imajlar GHCR'a gider, Dokploy yayına alır ve workflow yayını doğrular. **Bu, parçanın ilk somut çıktısıdır.**
2. `https://DOMAIN` açıldığında Türkiye üzerindeki canlı uçaklar haritada akar. Arama ile bir uçak bulunur, izlenir ve bağlantısı paylaşılır.
3. Parça 2'ye geçmeden önce adsb.lol'ün IST çevresindeki gerçek kapsaması 24 saat ölçülür ve raporlanır.

Hesaplar, olay motoru ve bildirimler sonraki parçalarda gelir. Bu parçada onlar için ekran, buton ya da boş sayfa eklenmez.

## Kilometre taşları
Her kilometre taşı ayrı bir dal ve PR'dır (CLAUDE.md → Git ve yayın). Planı `docs/plans/parca-1.md`'ye bu başlıklarla yaz ve onay al.

### M0 — Repo iskeleti (`p1/m0-skeleton`)
- pnpm workspaces + Turborepo. Görevler: `dev`, `dev:replay`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `build`, `ci:local` (lint + typecheck + test + build).
- Ortak ESLint, Prettier ve tsconfig (`strict`, `noUncheckedIndexedAccess`). ESLint kuralları: `no-warning-comments: error`, `--max-warnings 0`, üretim kodundan `tools/`/fixture/test import'unu yasaklayan `no-restricted-imports`.
- Windows hijyeni:
  - `.gitattributes`: `* text=auto eol=lf`, `*.{cmd,bat,ps1} text eol=crlf`, ikili uzantılar `binary`.
  - `.editorconfig` ve `.nvmrc` (24).
  - `pnpm-workspace.yaml` içinde `shellEmulator: true` ve `allowBuilds` (esbuild, sharp vb.).
  - Kabuktan bağımsız script'ler.
- Paket iskeletleri: `packages/{shared,i18n,geo,engine,providers,db}`, `apps/{web,api,worker}`. `apps/mobile` bu parçada **oluşturulmaz**.
- Her uygulamada zod ile env doğrulaması yapılır. Eksik ya da hatalı değerde anlaşılır hata verilir ve açılış durur. Kökte açıklamalı `.env.example` bulunur.
- `.github/workflows/ci.yml`: şimdilik yalnızca lint, typecheck, unit test ve build (pnpm cache). Deploy işi M1'de gelir.
- `.claude/settings.json` zaten repoda; ona dokunma.
- **Teslimat script'leri** (CLAUDE.md → Her iş sonrası teslimatlar):
  - `pnpm changelog`: `packages/shared/src/changelog/entries.ts` → `CHANGELOG.md` (TR + EN)
  - `pnpm stats`: satır sayısı; toplam, uygulama/paket ve dil bazında; lockfile ve `docs/research/` hariç
  - `pnpm backup`: `git archive` ile zip → `C:\PROJELER\ucus-takip-yedek\`. Commit'lenmemiş değişiklik varsa uyarır.
  - Hepsi Node script'idir (`scripts/*.mts`), kabuktan bağımsızdır.
- **Yerel görsel test ortamı:** `apps/web`'de iki gerçek sayfa vardır. Kök `/`, harita gelene kadar (M6) `/durum`'a yönlenir.
  - `/durum`: uygulama sürümü, `GIT_SHA`, API sağlık durumu (API yoksa "API'ye ulaşılamıyor" + nasıl başlatılacağı), kilometre taşı ilerlemesi.
  - `/yenilikler`: changelog kaynağından sürüm sürüm neler geldiği (TR/EN) ve her sürümde test edilebilecek sayfalara "Dene →" bağlantıları.

  `.claude/launch.json` web dev sunucusunu tanımlar (port 3000) ve Claude tarayıcı önizlemesinde açabilir.
- **Kabul:**
  - `pnpm install` ve `pnpm ci:local` temiz makinede yeşil.
  - CRLF'li bir dosya commit'lenemez (`git ls-files --eol` ile kontrol).
  - `pnpm dev` ile `http://localhost:3000/yenilikler` ve `/durum` açılır, TR/EN geçişi çalışır.
  - `pnpm stats` ve `pnpm backup` çalışır.

### M1 — Yayın iskeleti (`p1/m1-deploy`)
- `apps/api`: `/health` (canlılık), `/ready` (DB + Redis), `/version` (`GIT_SHA`, build zamanı). Altyapı: güvenlik başlıkları, `DOMAIN` için CORS izin listesi, pino (redact ile), OpenAPI, `trustProxy` (infra.md).
- `apps/web`: M0'daki `/durum` ve `/yenilikler` üretim imajında çalışır. Uygulama adı env'den gelir (boşsa kod adı). Sürüm ve API durumu çalışma zamanında sunucudan okunur. Ayrıca `/api/version` eklenir.
- `apps/worker`: `WORKER_ROLE` ayrıştırma ve sağlık uç noktası. İş rolleri sonraki kilometre taşlarında gelir; rol listesi env'den okunur.
- Dockerfile'lar, `docker-compose.yml` (üretim, yalnızca image), `docker-compose.build.yml`, `docker-compose.dev.yml` ve `ut-migrate` servisi: tamamı `docs/spec/infra.md` kurallarına göre.
- `ci.yml` tamamlanır. `changes` işi, tüm kontroller ve `compose-guard` eklenir; `deploy.yml` ve `rollback.yml` yazılır (infra.md'deki sözleşme). Deploy scripti Node ile yazılır (`scripts/deploy-dokploy.mts`): tetikleme, deployment yoklama, `/version` doğrulama. Unit testi `freshVolumes`'ın asla gönderilmediğini doğrular.
- `docs/DEPLOY_DOKPLOY.md` — kullanıcının izleyeceği adımlar, sırayla:
  1. Dokploy'u ≥ v0.30.7'ye yükselt. Panele HTTPS domain bağla, 3000 portunu kapat, Let's Encrypt e-postasını gir.
  2. Swap ve `docker stats` ile mevcut bellek durumunu kontrol et (infra.md bütçesi).
  3. GitHub sağlayıcısını bağla. Compose servisi oluştur: repo, `main`, `./docker-compose.yml`. **Autodeploy'u açıkça KAPAT** (varsayılanı açıktır).
  4. Registry: `ghcr.io` + classic PAT (`read:packages`).
  5. Environment sekmesine `.env.example`'daki üretim değişkenlerini gir.
  6. DNS A kayıtları: `DOMAIN` ve `api.DOMAIN` → VPS IP'si. Domain henüz seçilmediyse mevcut bir domain'in alt alan adı kullanılabilir.
  7. Domain'ler: `ut-web` port 3000, `ut-api` port `API_PORT`, HTTPS + Let's Encrypt. Domain değişikliğinden sonra yeniden deploy et.
  8. API token: mümkünse yalnızca bu projeye erişimi olan bir "deploy-bot" üyesiyle, 90 gün süreli. GitHub'da `production` environment'ı ve secrets: `DOKPLOY_URL`, `DOKPLOY_API_TOKEN`, `DOKPLOY_COMPOSE_ID` (servis URL'sinden alınır).
  9. `main` için branch protection: PR zorunlu, gerekli kontroller.
  10. İlk yayın ve doğrulama listesi (curl `/version`; WSS testi M5'te).
  11. "Deploy sırasında birkaç saniyelik kesinti olur" notu.
- **DUR:** M1 PR'ı birleşmeden önce kullanıcı DEPLOY_DOKPLOY.md adımlarını uygular. Ajan Dokploy API'sini kendisi çağırmaz.
- **Kabul:**
  - Yerelde `docker compose -f docker-compose.yml -f docker-compose.build.yml up` ile tüm servisler healthy.
  - Kullanıcı kurulumu bitirdikten sonra: web'deki bir metni değiştiren PR birleşir → ≤ 15 dk içinde `https://DOMAIN` yeni `GIT_SHA`'yı gösterir ve deploy işi yeşildir.
  - Bilerek bozulan bir imajda (healthcheck başarısız) deploy işi kırmızıya döner.

### M2 — Veritabanı ve referans verisi (`p1/m2-db`)
- Drizzle + drizzle-kit. PostGIS eklentisi ve partition DDL'i özel SQL migration'dır (infra.md → Migration).
- **Tablolar:**
  - `airports`
  - `runways`: eşik koordinatları (kaydırılmış eşik dahil), gerçek yön, uzunluk, `threshold_source`
  - `stations`: etkin istasyonlar, `is_primary`, yaklaşma ayarları, `geoid_undulation_m` (Parça 2'de doldurulur), kapsama kalitesi alanları
  - `flights`: uçuş örneği (hex, çağrı kodu, tescil, tip, ilk/son görülme, durum)
  - `track_points_sampled` ve `track_points_fine`: `PARTITION BY RANGE (ts)`, günlük, PK `(flight_id, ts)`, ts üzerinde BRIN. Tipler: lat/lon `double precision`, gs/track `real`, irtifa ve dikey hız `integer`, source `smallint`. Geometry sütunu **yoktur**.
  - `provider_health`
- Partition bakımı BullMQ `upsertJobScheduler` ile yapılır (`repeat` kullanılmaz; BullMQ v6'da kaldırıldı). İş 7 gün ilerisini açar, süresi dolanları `DETACH … CONCURRENTLY` + `DROP` ile siler. Sampled için 7 gün, fine için 30 gün (env).
- Seed idempotenttir: 5 istasyon, IST birincil.
- OurAirports içe aktarımı (data-sources.md §3): ilk açılışta ve sonra günlük. Her istasyon için ARP, alan yüksekliği, eşikler ve pist yönleri önbelleğe alınır.
- **Kabul:**
  - Temiz DB'de migrate çalışır. Hemen ardından `drizzle-kit generate` boş fark üretir.
  - Seed iki kez çalışınca kayıt yinelenmez.
  - Partition job integration testi geçer (gerçek PostgreSQL, sahte saat).
  - LTFM'nin 34L/16R ve diğer eşikleri makul koordinatlar verir (bilinen değerlere ±50 m).

### M3 — Sağlayıcılar (`p1/m3-providers`)
- `AircraftState` iç modeli:
  - Kimlik: hex, callsign, registration, typeCode, category, dbFlags, positionSource
  - Konum: lat, lon, altBaroFt | null, onGround, altGeomFt, navQnhHpa
  - Hareket: gsKt, trackDeg, trueHeadingDeg, baroRateFpm, geomRateFpm
  - Uzman alanları: iasKt, tasKt, mach, windDirDeg, windSpeedKt, oatC, selAltFt, navModes
  - Durum: squawk, emergency
  - Meta: sampleTime (UTC ms), source
- Ayrıştırıcı data-sources.md §1'deki "yanıt biçimi" kurallarının hepsini uygular. zod'da her alan opsiyoneldir.
- `adsbLol` adaptörü:
  - Nokta/yarıçap, çoklu hex, çağrı kodu ve tescil sorgularını destekler.
  - Zorunlu User-Agent gönderir; opsiyonel API anahtarı başlığı desteklenir.
  - Durum kodu JSON ayrıştırmadan önce kontrol edilir. 401/403, 429/420 ve 5xx ayrı hata türleridir. gzip açıktır.
- `localReceiver` adaptörü: `LOCAL_RECEIVER_URLS` listesi, opsiyonel token, alıcı başına sağlık metriği. Tanımlı değilse kapalıdır.
- Lisans kaydı ve `DATA_USAGE_MODE` denetimi (CLAUDE.md).
- Veri temizliği: geçersiz ya da eksik konum, 60 sn'den eski örnek ve imkânsız değerler (gs > 800 kt, |dikey hız| > 10.000 fpm) elenir.
- `ScheduleProvider` arayüzü yalnızca tip olarak tanımlanır: `resolveFlightNumber`, `getStationBoard`, lisans meta verisi. Uygulaması Parça 5'tedir.
- `tools/fixtures/`: adsb.lol'den elle alınmış gerçek birkaç yanıt örneği (`pnpm record` M7'de gelir; şimdilik elle, izin verilen hızda).
- **Kabul:** Unit testler geçer:
  - yerde irtifa, eksik alanlar, `lastPosition`
  - `now` ms/sn ayrımı, boş `flight`, `~` hex
  - `dbFlags` bitleri
  - 403 → config hatası, 429 HTML gövdesi → kısıtlama hatası

  Integration testler stub HTTP sunucusuna karşı geçer. Canlı istek atılmaz.

### M4 — Ingest (`p1/m4-ingest`, worker `ingest` rolü)
- Hız kontrolü: AIMD token bucket (data-sources.md §1). Sağlayıcı başına tek global kova vardır. Metrikler `provider_health`'e ve Redis'e yazılır.
- Kapsama planlayıcı ve öncelikler (data-sources.md "Kapsama planı"):
  - Birleşik ≤ 250 NM çemberler ve birincil istasyon için ek küçük çember.
  - P1 mekanizması `WATCH_HEX_LIST` env'iyle çalışır; Parça 2B'de DB'deki takiplerle değiştirilir.
  - P3 varsayılan kapalıdır.
- Veri birleştirme: aynı hex için en yeni `sampleTime` kazanır. Aynı örnek iki çemberden gelirse bir kez yazılır.
- Canlı durum `redis-live`'da tutulur:
  - `ac:{hex}` hash (TTL 120 sn)
  - GEO seti: her turda son görülmesi 120 sn'yi aşan üyeler silinir
  - `ac:updates` stream'i: `XADD MAXLEN ~ 50000` (Parça 2 motoru için)
  - `ac:batch` pub/sub (API yayını için, kompakt dizi formatında)
- İz yazıcı: `track_points_sampled`'a 30 sn'de bir örnek yazılır. `track_points_fine` kuralları domain.md "Saklama"dadır. Bu parçada sınıflandırma olmadığından fine'a yalnızca **ARP'a ≤ 30 km ve AGL < 10.000 ft** kuralı uygulanır. Yerde konumu 20 m'den az değişen örnekler yazılmaz. Toplu insert 1–2 sn'de bir yapılır.
- Uçuş örneği ayrıştırma domain.md'deki kurallara göre yapılır.
- Loglama: başarılı turlar `debug` seviyesinde; `info` seviyesinde dakikada bir özet satırı.
- **Kabul:** Unit testler (sahte saat) geçer:
  - Retry-After'sız 429'da hız ≤ %50'ye iner ve beklemeye geçer. 5 dk temiz yanıttan sonra kademeli toparlanır.
  - 403'te devre açılır ve yeniden deneme olmaz.
  - Kapsama birleştirme: 5 tohum istasyon tek batı çemberine sığar.
  - Bütçe paylaşımı: 0,2 rps'de birincil istasyon p95 ≤ 10 sn ve P1 açlığa düşmez.
  - Örnekleme ve uçuş örneği ayrıştırma.

  Integration testler geçer: Redis canlı durum (GEO süpürme, stream sınırı) ve iz yazıcı (gerçek PostgreSQL).

### M5 — Canlı API (`p1/m5-live-api`)
- `GET /v1/live?bbox=…` anlık görüntü döndürür. `bbox` kapsama dışındaysa yanıt bunu açıkça belirtir.
- `WS /v1/ws`:
  - `subscribe {viewport: bbox, zoom}` gelince önce tam görüntü gönderilir, sonra saniyede en fazla bir fark mesajı (eklendi / güncellendi / silindi).
  - Farklar **ızgara hücresi başına** bir kez serileştirilir (zoom kademesine göre sabit hücreler) ve o hücreye abone tüm istemcilere aynı Buffer gönderilir.
  - Her mesaj veri tazeliğini ve sağlayıcı durumunu (`ok | degraded | down`) taşır. Mesajlarda artan bir `seq` numarası bulunur.
  - 25 sn'de bir ping atılır; 2 pong kaçıran bağlantı kapatılır.
  - Geri basınç: `bufferedAmount > 1 MB` ise istemciye yalnızca son tam durum gönderilir; `> 4 MB` ise bağlantı kapatılır.
  - Sınırlar: IP başına 10 bağlantı, toplam `WS_MAX_CONNECTIONS` (varsayılan 2.000).
  - permessage-deflate varsayılan **kapalıdır**. Açılması Parça 4B'deki yük testine bağlıdır.
  - SIGTERM davranışı infra.md'de tanımlıdır.
- IP bazlı hız limiti uygulanır; sayaçlar `redis-queue`'dadır.
- **Kabul:**
  - WS protokol integration testleri geçer: tam görüntü → fark, geri basınç, ping/pong, reconnect mesajı.
  - Farklı `X-Forwarded-For` değerleriyle gelen istekler ayrı hız sayaçlarına düşer; güvenilmeyen kaynaktan gelen XFF yok sayılır.
  - Yayından sonra `wss://api.DOMAIN/v1/ws` üzerinden 5 dk boşta bağlantı kopmaz. Koparsa Traefik `readTimeout` notu DEPLOY_DOKPLOY.md'ye eklenir ve DUR-SOR (paylaşılan Traefik ayarıdır).

### M6 — Web canlı harita (`p1/m6-map`)
- Kök `/` artık haritayı gösterir (`/durum` yönlendirmesi kalkar). `/durum` ve `/yenilikler` menüden erişilebilir kalır.
- Tam ekran MapLibre GL JS v6 haritası. ESM-only olduğundan yalnızca client component'te yüklenir. Stil URL'leri çalışma zamanında sunucudan gelir; yedek stil davranışı data-sources.md §6'dadır.
- **Uçak gösterimi:** tek bir symbol katmanı. Yöne göre döndürülmüş **özgün** kategori siluetleri kullanılır (başka marka ikonu yok). Katman stil JSON'u `packages/shared`'dadır; mobil aynı JSON'u kullanacaktır.
- **Hareket:** güncellemeler arasında yer hızı ve yöne göre `requestAnimationFrame` ile ara değerleme yapılır (en fazla 10 sn ileri).
- **Bilgi kartı:** çağrı kodu, tescil, tip, irtifa, hız, dikey hız, son görülme ve veri kaynağı. PIA/LADD uçakta tescil gizlenir.
- **Arama:** hesap gerekmez. Çağrı kodu, tescil ve hex ile arama API üzerinden yapılır. Sonuca uçulur ve "İzle" kamerası uçağı ortalar. Seçili uçak URL'de tutulur (`/?hex=4bb26c`) ve paylaşılabilir. Uçak kapsama dışına çıkarsa kart bunu söyler.
- **Durum şeridi:** sağlayıcı `degraded` ya da `down` olunca açıklayıcı metin çıkar. Veri tazeliği görünür.
- **Atıflar:** ADSB.lol (ODbL, bağlantılı), OpenFreeMap/OpenMapTiles/OSM. Ayrıca `ATTRIBUTION.md` yazılır.
- Tüm metinler i18n'dedir (tr/en). Tasarım sistemi Parça 3'te gelir; burada sade ve düzgün bir görünüm yeterlidir.
- **Kabul:** Playwright E2E (replay ile): harita açılır → replay'deki uçak görünür ve hareket eder → tıklayınca bilgi kartı açılır → çağrı kodu araması uçağı bulur → URL ile doğrudan açılış aynı uçağı seçer.

### M7 — Dev araçları, canlı duman testi ve kapsama ölçümü (`p1/m7-tools`)
Bu araçlar üretimde başlatılamaz; açılışta doğrulanır.
- `tools/replay-receiver`: fixture'daki zaman sıralı readsb karelerini `aircraft.json` olarak sunar ve `localReceiver` adaptörünü besler. `pnpm dev:replay` bunu kullanır.
- `tools/scenarios`: sentetik senaryo üretici. Bu parçada seyir hâlindeki uçaklar yeterlidir.
- `pnpm record --station LTFM --minutes 30`: gerçek kareleri, hız kurallarına uyarak fixture'a kaydeder.
- `pnpm smoke:live` (elle çalıştırılır, 5 dk). Doğrular:
  - Türkiye bbox'ında (enlem 35–43, boylam 25–45) ≥ 50 uçak görülür
  - birincil istasyon veri yaşı p95 ≤ 10 sn
  - `provider_health` satırı yazılır
- `pnpm coverage:probe --hours 24` (elle çalıştırılır, 0,1 rps, birleşik çember). İstasyon başına şunları hesaplar ve `docs/reports/kapsama.md`'ye yazar:
  - görülen varış sayısı
  - en az bir yerde örneği (`alt_baro:"ground"`) olan varışların oranı
  - son havadaki örneğin medyan AGL'si ve eşiğe medyan mesafesi
  - `seen_pos` dağılımı
  - 429 oranı

  **Karar kuralı:** Yerde örneği oranı %70'in altındaysa o istasyonda iniş varsayılan olarak "muhtemel" sunulur (domain.md). Sonuç Parça 2'nin girdisidir.
- **DUR:** coverage probe'u kullanıcı başlatır (24 saat sürer ve kullanıcının IP'sini kullanır). Ajan komutu ve beklenen çıktıyı verir.

## Parça sonu
- `CLAUDE.md`'deki "Komutlar" bölümü doldurulur. `docs/reports/parca-1.md` yazılır: yapılanlar, komutlar ve sonuçları, ölçümler, bilinen sınırlar, ACTIVATION'a eklenenler.
- Üretimde ilk 24 saatin 429 oranı ve gerçekleşen tazelik rapora eklenir (VPS IP'si kullanıcı IP'sinden farklı sınırlanabilir).

## Tamamlanma kriterleri
- [ ] `pnpm ci:local` yeşil; PR'lardaki GitHub Actions yeşil (kanıt: `gh pr checks` çıktısı).
- [ ] Migration'lar temiz DB'de çalışır. Yükseltme testi yeşildir. Seed idempotenttir.
- [ ] Yerelde üretim compose'u tüm servislerle healthy olur.
- [ ] Push → CI → GHCR → Dokploy → `/version` doğrulaması uçtan uca çalışır; bozuk imajda kırmızıya döner.
- [ ] `pnpm smoke:live` kriterleri geçer. Yapay 429 testinde hız düşer ve toparlanır.
- [ ] `docs/reports/kapsama.md` 24 saatlik veriyle yazılmıştır.
- [ ] `docs/DEPLOY_DOKPLOY.md`, `docs/ACTIVATION.md` ve `docs/reports/parca-1.md` günceldir.
