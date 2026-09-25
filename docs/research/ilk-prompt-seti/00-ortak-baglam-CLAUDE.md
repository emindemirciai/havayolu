# Ortak Bağlam — repo köküne `CLAUDE.md` adıyla koy

> Claude Code bu dosyayı projedeki her oturumun başında otomatik okur. Başka bir araç kullanıyorsan bu içeriği her parçanın başına ekle. Başlamadan önce aşağıdaki üç değeri doldur.

## Doldurulacak değerler
- **APP_NAME:** `…`
- **DOMAIN:** `…` → web `https://DOMAIN`, API ve WebSocket `https://api.DOMAIN`
- **GITHUB_REPO:** `emindemirciai/…` (dal: `main`)

## Ürün
Herkese açık, ileride ücretli olacak bir sivil havacılık uçuş takip platformu. Önce web geliyor; iOS ve Android uygulaması (Expo) aynı backend'i kullanır.

Temel vaat: Kullanıcı bir uçuşu (sefer no / çağrı kodu), bir uçağı (tescil / hex) ya da bir istasyona gelen trafiği takip eder. Uçak istasyona yaklaşınca (varsayılan 10 km, ayarlanabilir) ve teker koyunca anında bildirim alır.

Flightradar24 premium'a benzer bir derinlik sunar: filtreli canlı harita, uçuş detayı, irtifa/hız grafiği, geçmiş oynatma ve istasyon varış panosu. Arayüz sade başlar; ayrıntı isteyen "Uzman" görünümüne geçer. Arayüz dili Türkçe önceliklidir, İngilizce ikinci dildir.

## Mimari ve teknoloji
Bu seçimleri gerekçesiz değiştirme. Zorunlu bir değişiklik olursa `docs/DECISIONS.md`'ye gerekçesiyle yaz.

- **Monorepo:** pnpm workspaces + Turborepo; TypeScript `strict`; Node.js aktif LTS.
- **`apps/web`:** Next.js (App Router), MapLibre GL JS, PWA + Web Push, admin paneli.
- **`apps/api`:** Fastify, REST (OpenAPI) + WebSocket.
- **`apps/worker`:** Tek imaj. `WORKER_ROLE` şu değerleri alır: `ingest | engine | notifier | jobs | all`. KVM 2'de varsayılan `all`.
- **`apps/mobile`:** Expo (React Native), Expo Router, development build, `@maplibre/maplibre-react-native`, expo-notifications, EAS.
- **Veri:**
  - PostgreSQL + PostGIS (Drizzle ORM)
  - Redis (anlık durum, GEO, stream, pub/sub, BullMQ)
- **Harita:** Stil `MAP_STYLE_URL` env'inden gelir (varsayılan OpenFreeMap).
- **Test:** Vitest, Playwright, jest-expo + React Native Testing Library, Maestro.
- **Yayın:**
  - GitHub Actions CI çalışır; başarılıysa Dokploy API ile Compose deploy tetiklenir.
  - Sunucu: Hostinger KVM 2 VPS + Dokploy (Traefik, Let's Encrypt).
  - VPS başka projelerle paylaşılabilir; her servise bellek limiti koy.

## Repo yapısı
```
apps/web  apps/api  apps/worker  apps/mobile
packages/shared     tipler, zod şemaları, sabitler
packages/i18n       tr (varsayılan) + en; web ve mobil ortak kullanır
packages/geo        mesafe, yön, ETA, pist geometrisi, irtifa düzeltmeleri
packages/engine     uçuş durum makinesi ve olay kuralları (saf fonksiyonlar, IO yok)
packages/providers  veri sağlayıcı adaptörleri + lisans kaydı
packages/db         Drizzle şeması, migration, seed
tools/              replay alıcısı, senaryo üretici, kayıt aracı (yalnızca dev/test)
docs/               DECISIONS, DESIGN, DEPLOY_DOKPLOY, RUNBOOK, ACTIVATION, plans/, reports/
```

## Veri kaynakları ve lisans — kesin kurallar
Ürün herkese açık ve ileride ücretli olacak. Bu yüzden yalnızca ticari kullanıma izin veren kaynaklar kullanılır.

**İzinli kaynaklar:**
- **Birincil canlı veri:** adsb.lol public API.
  - Anahtarsız; readsb / ADSBx v2 JSON formatı; veri ODbL lisanslı.
  - Oran limiti dinamiktir. 429 ve `Retry-After` yanıtlarına uy, hızı uyarlamalı yönet.
- **Opsiyonel canlı veri:** Kendi ADS-B alıcımız (readsb `aircraft.json`, aynı format). Yalnızca `LOCAL_RECEIVER_URL` tanımlıysa açılır.
- **Rota tahmini:** adsb.lol routeset. Sonuç her yerde "tahmini" etiketiyle gösterilir.
- **Referans verisi:**
  - OurAirports: havalimanı ve pist verisi, kamu malı.
  - aviationweather.gov: METAR/TAF; dakikada en fazla 100 istek, özel User-Agent zorunlu.
  - OpenFlights: havayolu verisi, ODbL.

**Yasak olanlar:**
- airplanes.live, adsb.fi, OpenSky'nin ücretsiz katmanı ve ticari olmayan kullanım şartı taşıyan her kaynak.
- Flightradar24 / FlightAware gibi sitelerden veri kazımak.
- Resmi olmayan uç noktalar.
- Başka markaların ikon ve görselleri.

**Lisans kaydı:**
- `packages/providers` kaydında her sağlayıcı şu meta veriyi taşır: `commercialUse`, `attribution`, `rateLimit`.
- `DATA_USAGE_MODE=commercial` varsayılandır. Bu moddayken `commercialUse: false` olan bir sağlayıcı başlatılamaz; uygulama açılışta hata verir.

**Atıflar:** Arayüzde ve `ATTRIBUTION.md`'de şunlar yer alır:
- adsb.lol katkıcıları (ODbL)
- OpenStreetMap / OpenMapTiles / OpenFreeMap
- OurAirports
- NOAA Aviation Weather Center
- OpenFlights

**Uçak gizliliği:** readsb `dbFlags` bitleri kullanılır (1 askeri, 2 ilginç, 4 PIA, 8 LADD; readsb dokümanından doğrula).
- Askeri işaretli uçaklar varsayılan olarak gösterilmez.
- LADD/PIA işaretli uçaklarda tescil ve sahip bilgisi gizlenir.
- Admin'in yönettiği hex engel listesi (kaldırma talepleri) her kanalda uygulanır.

## Alan sözlüğü ve birimler
- **İstasyon:** Takip edilen havalimanı. Varsayılan tohum: IST (LTFM), SAW (LTFJ), ESB (LTAC), ADB (LTBJ), AYT (LTAI).
- **Yaklaşma olayı:** Varışa giden uçağın hazır eşiklerden birine girmesi.
  - Mesafe eşikleri: 50/30/20/10/5 km.
  - Süre eşikleri: inişe 15/10/5/3 dk.
  - Varsayılan: 10 km.
- **Teker koyma:** Havada → yerde geçişi. Zaman ALDT olarak kaydedilir.
- **Muhtemel iniş:** Alçakta sinyal kaybından yapılan çıkarım. Bir güven düzeyi taşır.
- **Pas geçme:** Yaklaşmadan sonra inmeden tırmanış.
- **Birimler:** İrtifa ft, hız kt, mesafe km (NM seçeneği). DB'de tüm zamanlar UTC; arayüzde yerel/UTC seçimi var.

## Kalite çıtası (her parça için)
- Üretim kodunda şunlar yer almaz: TODO/FIXME, "daha sonra yapılacak", sahte buton, placeholder sayfa, mock veri, mock API.
- Anahtarı olmayan harici entegrasyon eksiksiz uygulanır. Env tanımlı değilse özellik temiz biçimde kapanır ve `docs/ACTIVATION.md`'ye yazılır.
- Replay/simülasyon yalnızca `APP_ENV=development|test` iken çalışır. Üretimde açılamaz; bunu açılışta doğrula.
- Kod kalitesi:
  - Lint ve typecheck sıfır hata ve uyarıyla geçer.
  - Tüm testler yeşildir.
  - Migration'lar temiz bir DB'de baştan sona çalışır.
  - Seed idempotenttir.
- Tüm env değişkenleri zod ile doğrulanır ve `.env.example`'da açıklamalı olarak yer alır. Sır repoya girmez.
- Kütüphaneleri kurulumda güncel stabil sürümleriyle seç ve resmi dokümandan doğrula. Uyumsuzluk varsa DECISIONS'a yaz.
- Arayüzde sabit metin yoktur; tüm metinler `packages/i18n`'dedir.

## Bilinçli olarak kapsam dışı
Bunlar ne kodda ne de arayüzde yer alır:
- Ödeme/abonelik ve plan yükseltme ekranları
- Ticari veri sağlayıcı entegrasyonu
- Uçak fotoğrafları
- Hava radarı katmanı
- 3B görünüm
- ATC sesi
- Kilit ekranı canlı kartı ve widget'lar
- Konum tabanlı özellikler

## Çalışma şekli
1. Her parçaya başlamadan önce repo durumunu ve önceki raporları (`docs/reports/`) incele.
2. `docs/plans/parca-N.md`'ye kısa bir plan yaz, sonra uygula.
3. Anlamlı adımlarda Conventional Commits ile commit at. Push'u yalnızca kullanıcı onay verince yap.
4. Belirsiz bir noktada standart ve güvenli seçeneği uygula; gerekçesini DECISIONS'a yaz.
5. Parça sonunda `docs/reports/parca-N.md` raporunu yaz. İçeriği:
   - yapılanlar
   - çalıştırılan komutlar ve sonuçları
   - test özeti ve ölçümler
   - bilinen sınırlar
   - dış aktivasyon adımları
6. Aşağıdaki "Komutlar" bölümünü oluşturduğun script'lerle güncel tut.

## Komutlar
Parça 1'de doldurulacak: kurulum, geliştirme, replay ile geliştirme, test, lint, typecheck, migration, seed.
