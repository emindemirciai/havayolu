# ucus-takip — proje kuralları

Bu dosya her oturumda otomatik yüklenir; yalnızca her zaman geçerli kuralları içerir. Ayrıntılar: `docs/spec/` (alan ve veri kaynakları), `.claude/rules/` (dizine özel kurallar), `docs/prompts/` (parça görevleri), `docs/REFERENCES.md` (doğrulanmış URL'ler).

## Değerler
- **APP_NAME:** henüz seçilmedi (kod adı `ucus-takip`). **DOMAIN:** henüz seçilmedi. İkisi de koda gömülmez; `APP_NAME`, `DOMAIN`, `CONTACT_EMAIL` env'den okunur.
- **GITHUB_REPO:** `<gh-kullanıcı>/ucus-takip`, dal `main`. Kullanıcı adı `gh api user -q .login` ile doğrulanır.
- **Birincil istasyon:** IST (LTFM). Tohum istasyonlar: IST, SAW, ESB, ADB, AYT.
- Web `https://DOMAIN`, API ve WS `https://api.DOMAIN`.

## Ürün (özet)
Türkiye odaklı, herkese açık, ileride ücretli olacak sivil havacılık uçuş takip platformu. Önce web (PWA), sonra aynı backend'i kullanan Expo iOS/Android uygulaması.
Kullanıcı bir uçuşu (sefer no / çağrı kodu), bir uçağı (tescil / hex) ya da bir istasyonun varış akışını (havayolu/tip filtreli) takip eder. Uçak istasyona yaklaşınca (varsayılan 10 km, ARP'a) ve teker koyunca bildirim alır. **Tek uçuş takibi ve istasyon operasyonu eşit önemdedir.**
FR24 premium benzeri derinlik sunar: filtreli canlı harita, uçuş detayı, irtifa/hız grafiği, geçmiş oynatma, istasyon panosu. Varsayılan görünüm sadedir, "Uzman" görünüm ayrıntıyı açar. Arayüz TR önceliklidir, EN ikinci dildir. ADS-B'nin sınırları kullanıcıya dürüstçe söylenir (`docs/spec/domain.md` → "v1 sınırları").

## Mimari (gerekçesiz değiştirme → DUR-SOR + `docs/DECISIONS.md`)
- **Monorepo:** pnpm workspaces + Turborepo, TypeScript `strict` + `noUncheckedIndexedAccess`, ESM.
- **`apps/web`:** Next.js App Router (`output: 'standalone'`), MapLibre GL JS, PWA + Web Push, admin paneli.
- **`apps/api`:** Fastify, REST (OpenAPI) + WebSocket.
- **`apps/worker`:** tek imaj, `WORKER_ROLE` = `ingest,engine,notifier,jobs` alt kümesi. Üretimde iki servis vardır: `ut-worker-rt` (`ingest,engine`) ve `ut-worker-bg` (`notifier,jobs`). `all` yalnızca yerel geliştirmede kullanılır.
- **`apps/mobile`:** Expo (development build, Expo Router), `@maplibre/maplibre-react-native`, expo-notifications, EAS.
- **Veri:** PostgreSQL + PostGIS (Drizzle). İki Redis: `redis-queue` (BullMQ, kalıcı) ve `redis-live` (anlık durum, kalıcı değil).
- **Paketler:** `packages/shared` (tipler, zod, sabitler, harita katman stilleri), `i18n`, `geo`, `engine` (saf, IO yok), `providers`, `db`. Ayrıca `tools/` (yalnızca dev/test).
- **Yayın:** GitHub Actions imajları derler → GHCR. Dokploy (Hostinger KVM 2, **başka projelerle paylaşılır**) yalnızca imaj çeker. VPS'te build yapılmaz.

## Sürüm pinleri (doğrulama 2026-09-25; yükseltme = ayrı PR)
Node 24 (`.nvmrc`: `24`; Node 26 LTS'ye geçiş 2026-10-28 sonrası ayrı PR, kullanıcı onayıyla) · pnpm 12.6 (`packageManager`, corepack'e güvenme) · **typescript 6.0.x** (TS 7 native henüz desteklenmiyor: typescript-eslint `<6.1` istiyor) · eslint 10 + typescript-eslint 8.70 · zod 4 · turbo 2.11 · next 16.3 · react 19.3 · fastify 5.x (6-alpha değil) · @fastify/websocket 11 · drizzle-orm 0.45 / drizzle-kit 0.31 (1.0-RC API'si yok) · maplibre-gl 6.x · bullmq 6.x + açık `ioredis` · redis 8 · `postgis/postgis:18-3.6` (`latest` değil) · vitest 5 · @playwright/test 1.63 · Expo SDK 57 (58 stabil çıktıysa DECISIONS ile) · @maplibre/maplibre-react-native ^11.4 (v11 API'si) · expo-server-sdk ^7.2 · web-push 3.6.7.

## Veri kaynakları — kesin kurallar (ayrıntı: `docs/spec/data-sources.md`)
- **İzinli:** adsb.lol API (ODbL; tek canlı kaynak), opsiyonel kendi alıcımız (`LOCAL_RECEIVER_URLS`), OurAirports (kamu malı), VRS standing-data (CC0; havayolu + rota), aviationweather.gov (METAR/TAF), OpenFreeMap (harita).
- **Yasak:** airplanes.live, adsb.fi, OpenSky (her katman), ADS-B Exchange Community/RapidAPI, Flightradar24 ve FlightAware'den kazıma, **FR24 resmi API'si** (şartları rakip ürünü yasaklar), adsb.lol `routeset`/`route` uç noktaları (Referer korumalı), resmi olmayan uç noktalar ve kütüphaneler, başka markaların ikon/görselleri.
- **Harici API'lere yalnızca worker erişir.** Web ve mobil istemci adsb.lol'e asla doğrudan istek atmaz.
- **Lisans kaydı:** `packages/providers` içindeki her sağlayıcı `commercialUse`, `attribution`, `shareAlike`, `rateLimit` bilgisini taşır. `DATA_USAGE_MODE=commercial` (varsayılan) iken `commercialUse:false` olan bir sağlayıcı başlatılamaz.
- **Gizlilik:** `dbFlags` (yoksa 0; bit testi ile): 1 askeri → varsayılan gizli, 4 PIA ve 8 LADD → tescil/sahip gizli. Admin'in hex engel listesi her kanalda uygulanır.
- **Ticari sağlayıcı entegrasyonu v1'de yoktur.** Yalnızca `ScheduleProvider` tip arayüzü tanımlanır (Parça 5).

## DUR VE SOR — bu durumlarda çalışmayı durdur, kullanıcıya sor
1. APP_NAME/DOMAIN gereken bir üretim adımı var ve değerler hâlâ boş.
2. Bir sır, hesap ya da etkileşimli giriş gerekiyor (Dokploy, GHCR, SMTP, `gh`, EAS/Expo, Apple, Google, S3, Sentry). **Değer uydurma.** Özellik env yokken temiz kapanacak şekilde bitir, adımı `docs/ACTIVATION.md`'ye yaz, devam et.
3. Bir veri kaynağının lisansı, şartı ya da davranışı belirsiz veya değişmiş (ör. adsb.lol 401/403 dönmeye başladı).
4. Üretimi etkileyen her eylem: Dokploy API çağrısı, üretim DB'si, VPS'e yük testi, DNS.
5. Mimari listesindeki bir seçimi değiştirmek ya da ücretli bir bağımlılık eklemek.
6. Push, PR birleştirme, repo dışında dosya silme.
7. Bir kabul kriteri 3 denemede geçmiyor. Hatayı, denenenleri ve seçenekleri özetle.

Listede olmayan küçük teknik belirsizliklerde standart ve güvenli seçeneği uygula, `docs/DECISIONS.md`'ye yaz.

## Git ve yayın
- `main` = üretim. Merge edilen her PR yayına çıkar. `main`'e doğrudan commit/push yapılmaz.
- Her kilometre taşı için dal açılır: `p<N>/m<K>-<kisa-ad>` (ör. `p1/m2-db`). Commit'ler Conventional Commits biçiminde ve İngilizce olur.
- Kilometre taşı bitince `pnpm ci:local` çalıştırılır. Sonra DUR ve sor: "`<dal>` dalını push edip PR açayım mı?" Onay gelirse `git push -u origin <dal>`, `gh pr create --fill`, `gh pr checks --watch` çalıştırılır ve çıktı rapora eklenir.
- PR'ı `main`'e birleştirmek yalnızca kullanıcının işidir.
- Yasak: `--force`, `--no-verify`, geçmişi yeniden yazmak, `.env*` (`.env.example` hariç) commit etmek.

## Çalışma döngüsü
1. Oturum başında `docs/plans/parca-N.md` (canlı ilerleme dosyası) ve son raporu (`docs/reports/`) oku. İlk tamamlanmamış kilometre taşından devam et.
2. Yeni bir parçada önce planı yaz: kilometre taşları, dokunulacak dizinler, kabul komutları, durum `[ ]`. Sonra DUR, onay al.
3. Bir oturumda tek kilometre taşı bitir. Kabul komutlarının çıktısını plana ekle, commit at, DUR ve kısa özet ver.
4. Parça sonunda `docs/reports/parca-N.md` yaz: yapılanlar, komutlar ve sonuçları, ölçümler, bilinen sınırlar, `docs/ACTIVATION.md`'ye eklenen adımlar.
5. `docs/ACTIVATION.md` kullanıcının elle yapacağı dış adımların **tek ve canlı** listesidir. Her satır şunları taşır: adım, env/secret adları, nerede yapılacağı, hangi özelliği açtığı, durum `[ ]`.
6. Doğrulama gerekiyorsa önce `docs/REFERENCES.md`'deki URL'leri kullan. Yeni kaynak eklersen oraya yaz.

## Her iş sonrası teslimatlar (kullanıcının kalıcı talebi)
Her kilometre taşı ya da bağımsız iş bittiğinde, sırayla:
1. **Sürüm ve Yenilikler:** Sürüm artırılır (1.0 öncesinde birleşen her kilometre taşı MINOR, düzeltme PATCH). Kullanıcıya dönük değişiklikler tek kaynağa yazılır: `packages/shared/src/changelog/entries.ts` (TR/EN, tarih, madde, varsa "Dene →" bağlantıları). Bu kaynaktan `CHANGELOG.md` üretilir (`pnpm changelog`) ve web'de `/yenilikler` sayfası beslenir. Bu sayfa, kullanıcının o sürümde görsel olarak test edebileceği sayfaların dizinidir. Maddeler kullanıcının anlayacağı dille yazılır.
2. **README:** `README.md` Türkçe ve İngilizce bölümleriyle güncellenir: sürüm, özellik durumu, yerelde çalıştırma, satır sayısı.
3. **Satır sayısı:** `pnpm stats` (git'teki dosyalar; lockfile ve `docs/research/` hariç) çalıştırılır. Toplam ve dağılım kullanıcıya bildirilir.
4. **Yerel test ortamı:** `pnpm dev` ile uygulama yerelde açılır ve tarayıcı önizlemesinde (`.claude/launch.json`) kullanıcıya gösterilir. Deploy'u beklemeden test edilebilir.
5. **Yedek:** `pnpm backup` çalıştırılır. `git archive` ile temiz bir zip üretilir (yalnızca commit'li dosyalar) → `C:\PROJELER\ucus-takip-yedek\ucus-takip-v<sürüm>-<tarih>.zip`. Dosya kullanıcıya gönderilir.
6. **CI yeşil, Dokploy hatasız:** Push'tan sonra `gh pr checks --watch` ya da `gh run watch` ile CI izlenir. Kırmızıysa düzeltilmeden iş bitmiş sayılmaz.

## Kalite çıtası
- **Üretim kodu** = üretim imajına giren her şey (`apps/*/src`, `packages/*/src`). Üretim kodunda TODO/FIXME, sahte buton, placeholder sayfa, mock veri ya da mock API yoktur. ESLint `no-warning-comments: error` ve `--max-warnings 0` ile zorlanır.
- **Testler** (`**/*.test.ts`, `**/test/**`, `e2e/`, `tools/`, `**/fixtures/**`) stub HTTP sunucusu, kayıtlı gerçek fixture, Mailpit, MinIO ve Turnstile test anahtarlarını kullanabilir. Üretim kodu bunları import edemez (`no-restricted-imports`).
- **CI ve testler canlı harici API'ye istek atmaz** (`EXTERNAL_PROVIDERS_DISABLED=true`). Canlı kontroller elle çalıştırılır: `pnpm smoke:live`, `pnpm record`, `pnpm coverage:probe`.
- **Anahtarı olmayan entegrasyon:** stub'a karşı integration testi geçer, env yokken özellik temiz kapanır, adım ACTIVATION'a yazılır. Admin'e kısıtlı işlevsel bir kurulum sayfası placeholder sayılmaz.
- **Env:** tüm env değişkenleri zod ile doğrulanır ve `.env.example`'da açıklamalı olarak durur. Sır repoya girmez. Çok satırlı anahtarlar `*_BASE64` olarak verilir.
- **Replay ve simülasyon** yalnızca `APP_ENV=development|test` iken çalışır; açılışta doğrulanır.
- **Temizlik:** migration'lar temiz DB'de baştan sona çalışır, seed idempotenttir. Lint, typecheck ve testler sıfır hatayla geçer.
- **Adlandırma:** kod tanımlayıcıları, enum ve DB değerleri, loglar ve commit'ler İngilizce ve ASCII'dir. Arayüz metinleri yalnızca `packages/i18n`'dedir (sabit metin yok). `docs/` Türkçedir.

## Geliştirici ortamı (Windows 11)
- Repo yolu `C:\PROJELER\ucus-takip` (ASCII, boşluksuz). `git config core.longpaths true` ayarlanır.
- `.gitattributes` LF'yi zorlar. Prettier `endOfLine: "lf"`. `pnpm-workspace.yaml` içinde `shellEmulator: true`.
- package.json script'lerinde `rm -rf`, `export`, `VAR=x cmd` ve tek tırnak yasaktır. Karmaşık işler `scripts/*.mts` (Node) olarak yazılır. `.sh` dosyaları yalnızca Linux konteynerinde çalışır.
- Docker gerektiren komutlardan önce `docker info` çalıştır. Hata verirse DUR ve kullanıcıdan Docker Desktop'ı açmasını iste.
- Komutlar hem Git Bash'te hem PowerShell'de çalışacak biçimde `pnpm <script>` olarak verilir.
- iOS Simulator bu makinede yoktur. iOS = EAS bulut build'i + gerçek cihaz.

## Bilinçli olarak kapsam dışı (v1)
Ödeme/abonelik ekranları, ticari veri sağlayıcı entegrasyonu (bkz. Parça 5), uçak fotoğrafları, hava radarı katmanı, 3B görünüm, ATC sesi, kilit ekranı canlı kartı/widget, konum tabanlı özellikler.

## Komutlar
Parça 1'de doldurulur ve güncel tutulur: kurulum, `dev`, `dev:replay`, `ci:local`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `build`, `db:migrate`, `db:seed`, `smoke:live`, `coverage:probe`, `record`, `changelog`, `stats`, `backup`.
