# Parça 1/4 — Altyapı, yayın hattı ve canlı veri

Önce `CLAUDE.md`'yi oku. Bu parçanın hedefi uçtan uca çalışan bir iskelet:
- GitHub'a push edildiğinde CI çalışır; geçerse Dokploy'da yayına alınır.
- `https://DOMAIN` açıldığında Türkiye çevresindeki canlı uçaklar haritada akar.

Hesaplar, olay motoru ve bildirimler sonraki parçalarda gelecek. Bu parçada onlar için ekran, buton ya da boş sayfa ekleme.

## 1. Monorepo ve araçlar
- Turborepo görevleri: `dev`, `dev:replay`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `build`.
- Ortak ESLint, Prettier ve tsconfig kullan (`strict`, `noUncheckedIndexedAccess`).
- Her uygulamada env'leri zod ile doğrula. Eksik ya da hatalı değerde anlaşılır bir hata ver ve açılışı durdur.
- Kök dizinde `.env.example` (her değişken açıklamalı), `.nvmrc` ve `.editorconfig` bulunsun.

## 2. Docker ve Compose
**Dockerfile'lar.** Her uygulama için çok aşamalı Dockerfile yaz:
- root olmayan kullanıcı
- `HEALTHCHECK`
- küçük imaj
- Next.js için `standalone` çıktı

**Geliştirme (`docker-compose.dev.yml`).** PostgreSQL + PostGIS, Redis ve Mailpit içerir. Uygulamalar yerelde `pnpm dev` ile çalışır.

**Üretim (`docker-compose.yml`, Dokploy).** Servisler: `web`, `api`, `worker`, `postgres`, `redis`.
- DB ve Redis dışarıya port açmaz.
- `depends_on` healthcheck koşuluna bağlıdır; `restart: unless-stopped`; kalıcı volume'lar kullanılır.
- Bellek limitleri env'den gelir. Varsayılanlar: postgres 1 GB, redis 512 MB, web 512 MB, api 512 MB, worker 768 MB.

**Redis ayarları.** Parola zorunlu, AOF açık, `maxmemory-policy noeviction` (BullMQ bunu gerektirir). Anlık durum anahtarları TTL ile temizlenir.

**Domain yönlendirmesi.** Dokploy'un Docker Compose domain dokümantasyonuna göre kur. Ağ ve Traefik etiketleri konusunda dokümana uy, varsayım yapma.

**Yapılandırma.** Ortama özgü değerleri build'e gömme. Web tarafında çalışma zamanında sunucudan okunan yapılandırma kullan.

## 3. Veritabanı (`packages/db`)
- Drizzle + drizzle-kit ile migration yaz. PostGIS eklentisi de migration ile kurulsun.

**İlk tablolar:**
- `airports`
- `runways`: eşik koordinatları, gerçek yön, uzunluk
- `stations`: etkin istasyonlar ve ayarları
- `flights`: uçuş örneği — hex, çağrı kodu, tescil, tip, ilk/son görülme, durum
- `track_points`: günlük partition'lı — flight_id, ts, lat, lon, alt_baro, alt_geom, gs, track, baro_rate, on_ground, source
- `provider_health`

**Partition bakım job'ı.** İleri tarihli partition'ları önceden açar; saklama süresi dolanları düşürür.

**Saklama varsayılanları** (env ile değiştirilebilir):
- Genel iz: 30 sn örnekleme, 7 gün saklama.
- İstasyon yaklaşma yarıçapındaki uçaklar (Parça 2'den itibaren takip listesindekiler de): tam çözünürlük, 30 gün saklama.

**Seed.** İdempotent olsun ve varsayılan istasyonları eklesin.

## 4. Referans verisi
- OurAirports `airports.csv` ve `runways.csv` dosyalarını içe aktar: ilk açılışta ve sonra günlük.
  - Değişmeyen satırı yeniden yazma.
  - Hatalı satırı atla ve logla.
- Her istasyon için ARP, alan yüksekliği, pist eşikleri ve pist yönleri hesaplanıp önbelleğe alınır.

## 5. Veri sağlayıcıları (`packages/providers`)
**Ortak ayrıştırıcı.** readsb v2 formatını iç model `AircraftState`'e çevirir. Alanlar:
- Kimlik: hex, callsign (boşluklar kırpılmış), registration, typeCode, category, dbFlags
- Konum ve irtifa: lat, lon, altBaroFt veya `'ground'`, altGeomFt, onGround, navQnhHpa
- Hareket: gsKt, trackDeg, baroRateFpm, geomRateFpm
- Durum: squawk, emergency
- Meta: sampleTime (UTC ms), source

`sampleTime` = yanıttaki `now` − `seen_pos`. `now`'ın birimi kaynağa göre saniye ya da milisaniye olabilir; gerçek örnek verilerle doğrula.

**`adsbLol` adaptörü:**
- Yarıçap, hex, çağrı kodu ve tescil sorgularını destekler.
- Uç noktaları ve parametreleri `https://api.adsb.lol/docs` şemasından doğrula. Çoklu hex destekleniyorsa toplu sorgu kullan.
- Kimliğini belirten bir `User-Agent` gönder. APP_NAME, DOMAIN ve `CONTACT_EMAIL` env'den gelir.

**`localReceiver` adaptörü.** `LOCAL_RECEIVER_URL` tanımlıysa readsb/tar1090 `aircraft.json` dosyasını okur (opsiyonel token ile). Tanımlı değilse kapalıdır.

**Lisans ve veri temizliği:**
- Lisans kaydı ve `DATA_USAGE_MODE` denetimi `CLAUDE.md`'deki kurallara göre çalışır.
- Şunlar elenir: geçersiz ya da eksik konum, 60 sn'den eski örnek, imkânsız değerler (ör. gs > 800 kt).

## 6. Çekme zamanlayıcısı (worker `ingest` rolü)
**Hız kontrolü.** Her sağlayıcı için uyarlanabilir bir token bucket:
- Başlangıç hızı env'den gelir (varsayılan 1 istek/sn).
- 429'da hızı çarpımsal olarak düşür ve `Retry-After`'a uy; başarılı isteklerde kademeli artır.
- 5xx'te jitter'lı geri çekilme uygula ve devre kesiciyi devreye al.
- Metrikleri `provider_health` tablosuna ve Redis'e yaz.

**Öncelikli iş kuyruğu:**
- **P0:** İstasyon yaklaşma çemberleri. İstasyon başına varsayılan 60 NM; hedef tazeleme 2–5 sn.
- **P1:** Takip listesi toplu sorgusu. Mekanizma bu parçada kurulur, içerik Parça 2'de gelir.
- **P2:** Statik kapsama bölgeleri. Türkiye'yi örten, en fazla 250 NM'lik çemberler; ayarlanabilir.
- **P3:** Dinamik izleyici bölgeleri. API'nin bildirdiği aktif görünümlerden gelir; LRU ile en fazla N adet.

**Kapsama birleştirme ve bütçe:**
- Çakışan çemberleri birleştir.
- Bir istasyon çemberi, yeterince taze çekilen daha büyük bir sorgunun içinde kalıyorsa ayrı istek atma.
- Mevcut hız bütçesini önceliklere göre paylaştır. Gerçekleşen tazelik sürelerini metrik olarak kaydet.

**Veri birleştirme.** Aynı hex için en yeni `sampleTime` kazanır. Yerel alıcının verisi daha tazeyse o tercih edilir.

**Canlı durum (Redis):**
- `ac:{hex}` hash (TTL 120 sn)
- GEO seti
- `ac:updates` stream'i (Parça 2'deki olay motoru için)
- `ac:batch` pub/sub (API yayını için, kompakt dizi formatında)

**İz yazıcı:**
- Örnekleme kurallarına göre 1–2 sn'de bir toplu insert yapar.
- Aynı hex için şu durumlardan biri yeni bir uçuş örneği başlatır: 30 dk veri boşluğu, çağrı kodu değişimi, yerde 20 dk bekleme.

## 7. API (`apps/api`) — bu parçanın kapsamı
**Sağlık uç noktaları:** `/health` (canlılık) ve `/ready` (DB + Redis).

**Altyapı:**
- güvenlik başlıkları
- `DOMAIN` için CORS izin listesi
- IP bazlı hız limiti
- pino ile yapılandırılmış log
- OpenAPI

**Canlı veri uç noktaları:**
- `GET /v1/live?bbox=…` anlık görüntü döndürür.
- `WS /v1/ws`:
  - `subscribe { viewport: bbox, zoom }` ile önce tam görüntü, sonra saniyede en fazla bir fark mesajı (eklendi / güncellendi / silindi) gönderilir.
  - permessage-deflate açıktır.
  - Yavaş istemcide mesajlar birleştirilir.
- Her mesaj veri tazeliğini ve sağlayıcı durumunu (`ok | degraded | down`) taşır.

**Dinamik bölgeler:**
- Aktif görünümleri Redis'e TTL ile yaz; worker bunları P3 bölgeleri olarak kullanır.
- Düşük zoom'da tüm dünyayı çekmeye çalışma; kapsama dışı alanları açıkça belirt.

## 8. Web (`apps/web`) — ilk canlı harita
Gerçek veriyle çalışan tam ekran bir MapLibre haritası:
- **Uçak gösterimi:** Uçaklar tek bir symbol katmanında, yöne göre döndürülmüş özgün kategori siluetleriyle çizilir.
- **Hareket:** Güncellemeler arasında yer hızı ve yöne göre yumuşak ara değerleme yapılır (en fazla 10 sn ileri tahmin).
- **Bilgi kartı:** Uçağa tıklayınca çağrı kodu, tescil, tip, irtifa, hız, dikey hız ve son görülme zamanı görünür.
- **Durum ve atıf:** Sağlayıcı kesintisinde açıklayıcı bir durum şeridi çıkar. Veri ve harita atıfları görünür.
- **Dil ve görünüm:** i18n altyapısı (tr/en) kurulur. Tasarım sistemi Parça 3'te gelecek; burada sade ve düzgün bir görünüm yeterli.

## 9. Dev/test araçları
Bu araçlar üretimde başlatılamaz.
- **`tools/replay-receiver`:** Fixture'daki zaman sıralı readsb karelerini `aircraft.json` olarak sunar ve `localReceiver` adaptörünü besler.
- **`tools/scenarios`:** Sentetik senaryo üretici. Bu parçada seyir hâlindeki uçaklar yeterli; yaklaşma ve iniş senaryoları Parça 2'de eklenecek.

## 10. CI/CD ve Dokploy
**`.github/workflows/ci.yml`** — PR'larda ve `main` push'unda çalışır:
- pnpm cache
- lint, typecheck, unit test
- integration test (PostGIS ve Redis servis konteynerleriyle)
- build
- Playwright duman testi (replay alıcısıyla)

**`.github/workflows/deploy.yml`:**
- `main`'de CI başarılıysa Dokploy API ile Compose deploy tetikler.
- Değişiklik yalnızca `apps/mobile/**` ya da `docs/**` altındaysa deploy etmez.
- Secrets: `DOKPLOY_URL`, `DOKPLOY_API_TOKEN`, `DOKPLOY_COMPOSE_ID`.
- Uç noktayı ve kimlik doğrulama başlığını Dokploy dokümantasyonundan doğrula.
- Deploy başarısız olursa workflow kırmızıya döner.

**`docs/DEPLOY_DOKPLOY.md`** — benim izleyeceğim adımlar, sırayla:
1. GitHub sağlayıcı bağlantısı.
2. Compose servisi (repo, `main`, `./docker-compose.yml`).
3. Autodeploy KAPALI (yayını Actions tetikler).
4. Env değişkenlerinin listesi.
5. Domain'ler: `DOMAIN` → web, `api.DOMAIN` → api (WS dahil) ve HTTPS.
6. API token oluşturma ve GitHub secrets.
7. İlk yayın ve doğrulama kontrol listesi.

## 11. Testler
**Unit:**
- readsb ayrıştırıcı (yerde irtifa, eksik alanlar, `seen_pos`)
- token bucket ve 429 davranışı
- öncelik kuyruğu ve kapsama birleştirme
- geo fonksiyonları
- uçuş örneği ayrıştırma
- örnekleme kuralları

**Integration:**
- adaptörler (test HTTP sunucusuna karşı)
- Redis canlı durum
- iz yazıcı + partition job'ı (gerçek PostgreSQL)
- REST ve WS protokolü

**E2E (Playwright):** Harita açılır → replay'deki uçak görünür ve hareket eder → tıklayınca bilgi kartı açılır.

## Tamamlanma kriterleri
- [ ] `pnpm lint`, `typecheck`, `test`, `test:integration`, `test:e2e` ve `build` hatasız çalışır.
- [ ] Migration'lar temiz DB'de baştan sona çalışır; seed iki kez çalışınca kayıt yinelenmez.
- [ ] `docker compose -f docker-compose.yml up` ile tüm servisler healthy olur.
- [ ] Yerelde adsb.lol'den gerçek veri akar. Yapay 429 testinde hız otomatik düşer ve toparlanır.
- [ ] CI yeşildir. Deploy workflow'u secrets girildiğinde çalışacak durumdadır.
- [ ] `CLAUDE.md`'nin "Komutlar" bölümü günceldir ve `docs/reports/parca-1.md` yazılmıştır.

## Dış aktivasyon adımları (raporda listele)
- DNS A kayıtları (`DOMAIN`, `api.DOMAIN`)
- Dokploy servis, env ve domain ayarları
- Dokploy API token'ı ve GitHub secrets
- Opsiyonel: yerel alıcı adresi
