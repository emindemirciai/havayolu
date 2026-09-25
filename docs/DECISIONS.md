# Kararlar

Her karar tarih, gerekçe ve varsa alternatifiyle yazılır. En yeni karar en üsttedir.

## 2026-09-25 — Dört açılı inceleme sonrası düzeltmeler ve yeni kullanıcı kararları
Yeniden yazılan prompt seti dört bağımsız inceleyiciden geçti: sadakat, tutarlılık, yürütülebilirlik, hedefe uygunluk ve dil. 129 bulgunun kabul edilenleri işlendi.

**Repo, yayın ve kaynaklar**
- **D-025 Repo özel, plan GitHub Free (kullanıcı kararı).**
  - Dal koruması ve environment yok. Secrets repo düzeyinde tutulur.
  - CI ayda 2.000 dk ile sınırlı: PR çalışmaları iptal edilebilir, imajlar yalnızca `main`'de derlenir.
  - Repoyu kullanıcı web'den açar; ilk push'u ajan yapar.
- **D-026 PR'ları ajan birleştirir (kullanıcı kararı).** CI yeşilse merge commit ile birleştirir (squash ve rebase yok), sonra yayını doğrular. Kırmızı PR birleştirilmez. D-019'daki "yalnızca kullanıcı birleştirir" kuralının yerini alır.
- **D-027 Bütün servisler Parça 1'de tanımlanır (kullanıcı talebi: "sonradan tek tek uğraşmayalım").**
  - Servisler: web, API (WS), admin (aynı web konteyneri, `ADMIN_HOST`), iki worker, migrate, Postgres, iki Redis.
  - `.env.example` bütün parçaların değişkenlerini baştan içerir; kullanıcı Dokploy'u bir kez kurar.
- **D-028 Analiz = kullanıcının kendi uygulaması (Siteni Analiz Et, MIT).** Umami değerlendirildi, kullanıcı kendi reposunu seçti.
  - Ayrı bir Dokploy Compose uygulamasıdır; bizim API'miz onun platform-admin giriş sözleşmesini karşılar (`/api/auth/login`, `/api/admin/session`, `/api/auth/me`).
  - Takip script'i kalıcı `localStorage` kimliği tuttuğu için yalnızca kullanıcı onayıyla yüklenir (KVKK Çerez Rehberi).
  - `ANALYZE_GEO_LOOKUP=false` önerilir: ip-api.com'un ücretsiz katmanı ticari kullanıma kapalıdır ve HTTP kullanır.
- **D-029 Lisans: kod MIT (kullanıcı talebi).** Veri kendi lisansındadır: adsb.lol ODbL, OurAirports kamu malı, VRS CC0, OSM ODbL.
- **D-030 Yerel portlar 3100/4100 vb.** Bu makinede 3000–3003 başka bir projenin konteynerlerinde. Konteyner içi üretim portları değişmez.
- **D-031 adsb.lol hız bütçesi yarıya indi.** Başlangıç 0,1 istek/sn, üst sınır 0,2. Tazelik hedefleri: IST ≤ 20 sn, diğer istasyonlar ≤ 30 sn, Doğu ≤ 90 sn. Doğrulanan ölçüm "10 sn'de bir ya da daha yavaş" diyordu; önceki 0,2/0,5 değerleri bunun iki katıydı.
- **D-032 Web ve API host'ları ayrı env'lerdir** (`WEB_HOST`, `API_HOST`, `ADMIN_HOST`, `ANALYTICS_HOST`). `api.` öneki türetilmez. Kalıcı domain seçilene kadar geçici host kullanılır.
- **D-033 Dokploy secrets yokken deploy `DEPLOY_ENABLED` değişkeniyle atlanır.** İş özetine "YAYINLANMADI" yazılır (D-023'ün uygulaması).

**Veritabanı ve yedekleme**
- **D-034 Yedeği uygulamanın kendi job'ı alır (`ut-worker-bg`).** Dokploy Compose Backups kullanılmaz: komutu sabittir ve iz tablolarını dışlayamaz.
  - İz tabloları yedeğe girmez; v1'de partition arşivi ve günlük ODbL dökümü yoktur.
  - `/acik-veri` sayfası ODbL 4.6(b) uyarınca yöntem belgesi sunar.
- **D-035 Partition bakımında `DETACH … CONCURRENTLY` kullanılmaz** (DEFAULT partition varken PostgreSQL izin vermez). Silme gece yapılır: `lock_timeout` ile `DETACH` + `DROP`.
- **D-036 Drizzle ile partition:** Parent tablolar şemada `pgTable` olarak tanımlanır, üretilen SQL elle `PARTITION BY` ile düzenlenir, çocuklar özel SQL'dir. `drizzle-kit push` ve `pull` kullanılmaz.
- **D-037 PG 18 volume yolu `/var/lib/postgresql`'dir** (`/data` değil).

**Ürün ve iniş tespiti**
- **D-038 İniş tespitinde `low` güven ve `landing_unknown`.** Alıcı olmadığı için bazı uçaklar yüksekte kaybolur; takip asla sessizce bitmez, "iniş verisi alınamadı" bildirimi gider. `landing_unverified` olayı eklendi. Bütün motor eşikleri domain.md'de toplandı.
- **D-039 Kapsama raporu üretim verisinden çıkarılır** (`coverage:report`). Kullanıcının bilgisayarında 24 saat çalışan probe yalnızca yedek yoldur.
- **D-040 Proje sahibinin ilk bildirimi SMTP'ye bağlı değildir.** Giriş Parça 1'deki yönetici oturumuyla yapılır (`ADMIN_EMAIL` + `ADMIN_SETUP_TOKEN`). VAPID anahtarlarını kullanıcı üretir; ajan çıktıyı görmez.
- **D-041 Kilometre taşları bölündü ve `[k]` durumu eklendi.** Bölünenler: P1 M1a/M1b, P2 M8a/M8b, P3 M3a/M3b ve M6a/M6b, P4 M2a/M2b. `[k]` = kod bitti, kullanıcı doğrulaması bekliyor.
- **D-042 Replay ve senaryo araçları Parça 1 M4'e alındı.** M6 E2E testleri bunlara bağlıdır. Harita testleri canvas yerine erişilebilir "görünen uçaklar" tablosunu okur.
- **D-043 v1 kapsamı daraltıldı.** Çıkarılanlar: telsiz çağrı adları, iz partition arşivi, günlük ODbL dökümü, mobil CI ve OTA. Yük testi 200 WS istemcisiyle, performans testi 500 uçakla yapılır.
- **D-044 Saatlik push sınırı:** `free` planda 60, admin için sınırsız. Açıkça takip edilen uçuşun iniş bildirimi özete çevrilmez. Takip kurmak tek dokunuştur; ayrıntılar "Ayrıntılı ayarlar" altındadır.
- **D-045 Terimler sabitlendi.** "Uyarı mesafesi" / "pist eşiği" (tek başına "eşik" yazılmaz), "uçuş kaydı" (örnek değil), "iniş" üst terimi, "bildirim merkezi", "Uçağı ortala" (takip değil), "harfli numaralı çağrı kodu".

## 2026-09-25 — Kullanıcının kalıcı teslimat talepleri ve araç sürümleri
- **D-021 TypeScript 6.0.x'e sabitlendi.** npm `latest` TS 7.0 (native derleyici). typescript-eslint 8.70'in peer aralığı `typescript <6.1`. TS 7'ye geçiş, typescript-eslint desteği gelince ayrı PR ile yapılır.
- **D-022 Her iş sonrası teslimatlar (kullanıcı talebi):**
  - sürüm artırma ve Yenilikler: tek kaynak `packages/shared/src/changelog/entries.ts`; bundan `CHANGELOG.md` ve `/yenilikler` üretilir
  - TR/EN README
  - satır sayısı
  - yerel test ortamı
  - `git archive` zip yedeği
  - yeşil CI

  Sürümleme 1.0 öncesinde: birleşen kilometre taşı MINOR, düzeltme PATCH. v1.0.0 herkese açık lansmandır.
- **D-023 Dokploy kurulmadan deploy adımı atlanır, CI yeşil kalır.** Kullanıcı "Dokploy'da ve CI'da hata istemiyorum" dedi.
- **D-024 İlk kuruluş commit'i doğrudan `main`'e atıldı.** Bu, `main`'e yapılan tek doğrudan push olur. Sonraki işler kilometre taşı dalları ve PR'larla ilerler.

## 2026-09-25 — Proje kuruluşu ve prompt setinin revizyonu
İlk prompt seti (ortak bağlam + 4 parça, 5 dosya) 17 ajanlı bir doğrulamadan geçirildi: kaynak doğrulama, şüpheci ikinci kontrol ve üç açıdan eleştiri. Ham notlar `docs/research/` altındadır.

**Kapsam, kaynaklar ve lisanslar**
- **D-001 Ad ve domain boş bırakıldı.** Kullanıcı "touchdown" istedi; .com/.app/.io/.net/.dev/.live/.aero uzantılarının hepsi kayıtlı çıktı (RDAP). Kod adı `ucus-takip`'tir; ad ve domain env'den okunur.
- **D-002 İmajlar GitHub Actions'ta derlenir ve GHCR'a gönderilir; Dokploy yalnızca çeker.** VPS paylaşımlı; Dokploy'un kendi dokümanı sunucuda build'in sunucuyu dondurabileceğini söylüyor.
- **D-003 v1'de yalnızca ücretsiz veri kullanılır.** adsb.lol tek canlı kaynaktır. Ticari tarife sağlayıcısı Parça 5'e bırakıldı.
- **D-004 Birincil istasyon IST (LTFM).**
- **D-005 İki kullanım eşit:** tek uçuş takibi ve istasyon operasyonu (tam ekran operasyon panosu).
- **D-006 Kendi ADS-B alıcısı yok (kullanıcı kararı).** `probable_landing` birinci sınıf bir yoldur; `LOCAL_RECEIVER_URLS` desteği kodda hazır bekler.
- **D-007 adsb.lol gerçekleri:**
  - açık User-Agent zorunlu
  - CORS yok
  - hız limiti dinamik, 429'da Retry-After yok
  - istasyon başına ayrı çember yerine birleşik ≤ 250 NM çember
  - ileride API anahtarı gelecek (env hazır)

  Hız değerleri D-031 ile güncellendi.
- **D-008 Rota kaynağı VRS standing-data (CC0).** adsb.lol `routeset` Referer korumalıdır; gizli `route` güvenilmezdir.
- **D-009 Havayolu kaynağı VRS standing-data (CC0).** OpenFlights kullanılmaz.
- **D-010 FR24 resmi API'si yasak** (ToS 6.3.1). FlightAware AeroAPI ancak yazılı karıştırma izniyle kullanılabilir.
- **D-011 ODbL yükümlülükleri kabul edildi.** Kullanıcı verisi ayrı şemada tutulur. Ücret veriye değil özelliklere alınır.

**Mimari ve araçlar**
- **D-012 Redis ikiye bölündü:** `redis-queue` (BullMQ, AOF, noeviction) ve `redis-live` (kalıcı değil, volatile-ttl).
- **D-013 İz verisi iki tabloya bölündü:** sampled 7 gün, fine 30 gün.
- **D-014 Tek seferlik `ut-migrate` servisi** ve expand/contract migration kuralı.
- **D-015 Worker üretimde ikiye bölündü:** `ut-worker-rt` ve `ut-worker-bg`.
- **D-016 Doğrudan APNs yolu yazılmaz.** Expo push, `interruptionLevel: "time-sensitive"`'ı destekliyor.
- **D-017 Fontlar:** B612 Türkçe glif içermiyor. Arayüzde Overpass, veride IBM Plex Mono kullanılır.
- **D-018 Sürüm sabitleri CLAUDE.md'dedir.**

**Çalışma ve süreç**
- **D-019 Git akışı:** kilometre taşı dalları ve PR'lar; `main` = üretim. Birleştirme yetkisi D-026 ile ajana verildi.
- **D-020 Kilometre taşı sırası temel vaade göre düzenlendi.** Yayın hattı Parça 1 M1'de, proje sahibine ilk gerçek bildirim Parça 2 M4'te gelir. Yedekleme, kayıt üretimde açılmadan önce (Parça 2 M9) kurulur. M5–M8 sırasında üretimde yalnızca admin hesabı vardır (`REGISTRATION_ENABLED=false`).
