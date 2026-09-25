# Kararlar

Her karar tarih, gerekçe ve (varsa) alternatifle yazılır. En yeni en üstte durur.

## 2026-09-25 — Kullanıcının kalıcı teslimat talepleri ve araç sürümleri
- **D-021 TypeScript 6.0.x'e pinlendi.** npm `latest` TS 7.0 (native derleyici). typescript-eslint 8.70'in peer aralığı `typescript <6.1`. TS 7'ye geçiş, typescript-eslint desteği gelince ayrı PR ile yapılır.
- **D-022 Her iş sonrası teslimatlar** (kullanıcı talebi): sürüm artırma + Yenilikler (tek kaynak `packages/shared/src/changelog/entries.ts` → `CHANGELOG.md` ve `/yenilikler`), TR/EN README, satır sayısı, yerel test ortamı, `git archive` zip yedeği, yeşil CI. Sürümleme 1.0 öncesinde: birleşen kilometre taşı = MINOR, düzeltme = PATCH. v1.0.0 herkese açık lansmandır.
- **D-023 Dokploy secrets yokken deploy adımı atlanır, CI yeşil kalır.** Kullanıcı "Dokploy'da ve CI'da hata istemiyorum" dedi. Dokploy kurulumu bitmeden `main`'e yapılan her push'un kırmızıya dönmesi kabul edilemez.
- **D-024 İlk kuruluş commit'i doğrudan `main`'e atıldı** (bootstrap). Sonraki işler kilometre taşı dalları ve PR'larla ilerler.

## 2026-09-25 — Proje kuruluşu ve prompt setinin revizyonu
İlk 5 parçalık prompt seti 17 ajanlı bir doğrulama sürecinden geçirildi: kaynak doğrulama, şüpheci ikinci kontrol ve üç açıdan eleştiri. Ham notlar `docs/research/` altındadır. Aşağıdaki kararlar o çalışmanın ve kullanıcıyla yapılan soru-cevabın sonucudur.

- **D-001 Ad ve domain boş bırakıldı.** Kullanıcı "touchdown" istedi; .com/.app/.io/.net/.dev/.live/.aero uzantılarının hepsi kayıtlı çıktı (RDAP). Kod adı `ucus-takip` kullanılır; ad ve domain env'den okunur.
- **D-002 İmajlar GitHub Actions'ta derlenir, GHCR'a gönderilir; Dokploy yalnızca çeker.** VPS başka projelerle paylaşılıyor (bellek zaten %52 dolu). Dokploy'un kendi dokümanı sunucuda build'i "sunucuyu dondurabilir" diye uyarıyor. Compose için build server desteği yok.
- **D-003 Yalnızca ücretsiz veri (v1).** adsb.lol tek canlı kaynaktır. Ticari tarife sağlayıcısı Parça 5'e bırakıldı; `ScheduleProvider` yalnızca tip olarak tanımlanır.
- **D-004 Birincil istasyon IST (LTFM).** Kapsama ölçümü, fixture kayıtları ve tazelik önceliği IST ile başlar.
- **D-005 İki kullanım eşit:** tek uçuş takibi ve istasyon operasyonu. Filtreli istasyon akışında olay başına push gider ve saatlik sınır ayarlanabilir. Açıkça takip edilen uçuşun iniş bildirimi özete çevrilmez. Tam ekran operasyon panosu vardır.
- **D-006 Kendi ADS-B alıcısı yok (kullanıcı kararı).** Anlık ölçümde IST çevresinde yerde uçak görünmedi. `probable_landing`, güven düzeyi ve tahmini saatle birinci sınıf bir yol olarak tasarlanır. `LOCAL_RECEIVER_URLS` desteği kodda hazır bekler.
- **D-007 adsb.lol gerçekleri:**
  - Açık User-Agent zorunlu (varsayılan `node` UA'sı 403 alıyor).
  - CORS yok; yalnızca worker çağırır.
  - Hız limiti dinamik, 429'da Retry-After yok; varsayılan 0,2 rps + AIMD.
  - İstasyon başına çember yerine birleşik ≤ 250 NM çember kullanılır.
  - İleride API anahtarı gelecek; env şimdiden hazır.
- **D-008 Rota kaynağı VRS standing-data (CC0).** adsb.lol `routeset` Referer korumalı ve üçüncü taraflara boş dönüyor; gizli `route` uç noktası güvenilmez ve "plausible" alanı her zaman true dönüyor.
- **D-009 Havayolu kaynağı VRS standing-data (CC0).** OpenFlights kullanılmaz: 2017'den beri güncellenmiyor, AJet'i içermiyor ve ODbL share-alike yükü getiriyor.
- **D-010 FR24 resmi API'si yasak.** ToS 6.3.1 rakip ürün geliştirmeyi ve başka gerçek zamanlı kaynağı tamamlamayı yasaklıyor. FlightAware AeroAPI ancak yazılı karıştırma izniyle kullanılabilir.
- **D-011 ODbL yükümlülükleri kabul edildi.** Saklanan iz verisi türetilmiş veritabanıdır; `/acik-veri` sayfasında sunulur. Kullanıcı verisi ayrı şemada tutulur. Ücret veriye değil özelliklere alınır.
- **D-012 Redis ikiye bölündü:**
  - `redis-queue`: BullMQ, AOF, `noeviction`.
  - `redis-live`: anlık durum, kalıcı değil, `volatile-ttl`.

  Gerekçe: yüksek hacimli canlı veri `noeviction` altında kuyruğu kilitleyebilir.
- **D-013 İz verisi iki tabloya bölündü** (`track_points_sampled` 7 gün, `track_points_fine` 30 gün). Tek tabloda partition düşürerek iki farklı saklama süresi uygulanamaz. Partition DDL'i özel SQL'dir çünkü Drizzle partition desteklemiyor (#6235).
- **D-014 Tek seferlik `ut-migrate` servisi** ve expand/contract migration kuralı.
- **D-015 Worker üretimde ikiye bölündü** (`ut-worker-rt`: ingest+engine, `ut-worker-bg`: notifier+jobs). Böylece bildirim gecikmesi ingest yükünden etkilenmez.
- **D-016 Doğrudan APNs yolu yazılmaz.** Expo push API'si `interruptionLevel: "time-sensitive"` destekliyor.
- **D-017 Fontlar:** B612 Türkçe glif içermiyor (ğ ş ı İ yok). Arayüz Overpass, veri IBM Plex Mono ya da Atkinson Hyperlegible Mono.
- **D-018 Sürüm pinleri** CLAUDE.md'de. Node 24; Node 26 LTS'ye (2026-10-28) geçiş ayrı PR ile yapılır.
- **D-019 Git akışı:** kilometre taşı dalları + PR. `main` = üretim, birleştirmeyi yalnızca kullanıcı yapar. Push ve merge `.claude/settings.json` ile onaya bağlıdır.
- **D-020 Milestone sırası temel vaade göre düzenlendi:** yayın hattı Parça 1 M1'de, sahibine ilk gerçek bildirim Parça 2 M4'te gelir. Yedekleme kullanıcı verisinden önce (Parça 2 M9) kurulur. Üretimde kayıt, yedek ve yasal metin hazır olana kadar kapalıdır (`REGISTRATION_ENABLED=false`).
