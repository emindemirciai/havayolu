# Parça 2 — Olay motoru, ilk gerçek bildirim, hesaplar ve takip

**Başlatma:** `@docs/prompts/parca-2.md dosyasındaki Parça 2'ye başla`
**Önce oku:** `docs/reports/parca-1.md`, `docs/reports/kapsama.md`, `docs/spec/domain.md` (tamamı), `docs/spec/data-sources.md` §4–5.

## Hedef
- **2A:** Sahibi (ADMIN_EMAIL) kendi telefonuna, gerçek IST varışları için "10 km" ve "indi" bildirimlerini alır. Bu, ürünün temel vaadinin ilk gerçek kanıtıdır.
- **2B:** Kullanıcı hesap açar. Bir uçuşu, uçağı ya da filtreli istasyon akışını takibe alır. Olaylar web push, mobil push (gönderici hazır; uygulama Parça 4'te) ve uygulama içi kanaldan iletilir. Kullanıcı verisi üretime girmeden önce yedekleme kurulmuş olur.

Kapsama raporuna göre IST'de inişlerin çoğu `probable_landing` olacaktır (kullanıcının kendi alıcısı yok). Bu yol birinci sınıf tasarlanır ve test edilir.

## 2A — Olay motoru ve sahibine ilk bildirim

### M1 — Geo ve saf motor (`p2/m1-engine`)
- `packages/geo`:
  - büyük daire mesafesi ve yön
  - eşiğe/merkez hattına yanal sapma
  - pist hizası: track ile pist yönü farkı ≤ 15° ve merkez hattından yanal sapma ≤ 1 km
  - yumuşatılmış yaklaşma hızı ve ETA
  - kaydırılmış eşik hesabı
- `packages/engine` (saf fonksiyonlar, IO yok). Her uçak için şunlar tutulur: son N örneklik halka tampon, uçuş örneği, aday istasyonlar.
- Her örnekte hesaplanan metrikler:
  - ARP'a ve eşiklere mesafe ve yön
  - yaklaşma hızı ve ETA
  - AGL (M2'deki yöntemle)
  - yumuşatılmış dikey hız
  - pist hizası
- **Varış sınıflandırması** — şunlardan biri sağlanırsa uçak varışta sayılır:
  - Tahmini rotanın (VRS) varış meydanı bu istasyon ve rota uygunluğu düşük değil.
  - AGL < 10.000 ft, yumuşatılmış dikey hız < −300 fpm ve mesafe azalıyor.
  - 15 km içinde pist hizasında ve AGL < 4.000 ft.
  - `navModes` `approach` içeriyor ve istasyona 30 km içinde (ek sinyal).
- **Kalkış ayrımı:** İstasyondan havalanan uçak 10 dakika boyunca o istasyon için yaklaşma olayı üretmez.
- Durumlar ve olaylar domain.md'deki İngilizce kodlarla uygulanır.
- `touchdown` koşulu:
  - havada → yerde geçişi
  - ARP'a ≤ 6 km ya da pist poligonunun 300 m tamponu içinde
  - gs < 180 kt

  Doğrulama: 15 sn içinde ikinci bir yerde örneği ya da azalan gs. ALDT = ilk yerde örneğinin `sampleTime`'ı. Hizalı pist belirlenir (ör. "34L").
- `probable_landing`: domain.md "İniş tespiti ve kapsama gerçeği" bölümündeki `high`/`medium` güven kuralları, tahmini iniş saati ve **kesinti bastırma** kuralları uygulanır. Uçak sonra yerde görülürse aynı kayıt `touchdown` olarak doğrulanır; yeni push gitmez, uygulama içi kayıt güncellenir.
- `go_around` koşulu: `APPROACHING` durumunda (≤ 10 km ya da finalde) iken iniş olmadan ≤ 60 sn içinde ≥ 400 ft tırmanış ve dikey hız > +500 fpm.
- `takeoff`: istasyonda yerde → havada geçişi.
- Konum kaynağı `mlat`, `tisb_*` ya da `other` ise olay tespitinde düşük ağırlık alır.
- İdempotensi ve determinizm:
  - Benzersiz anahtar domain.md'de tanımlıdır.
  - Sıra dışı gelen eski örnekler atlanır.
  - Aynı örnek dizisi her zaman aynı olayları üretir.
- **Senaryolar** (`tools/scenarios`, IST pistleri üzerinde; her biri beklenen olay listesi ve zaman toleransıyla test edilir):
  1. düz ILS yaklaşması, yerde örnekli iniş → `touchdown` (ALDT ±5 sn)
  2. düz yaklaşma, 250 ft'te sinyal kaybı → `probable_landing` `high`
  3. 800 ft'te sinyal kaybı → `probable_landing` `medium`
  4. pas geçme ve ikinci yaklaşmada iniş
  5. kalkış
  6. FL350'de üstten geçiş (olay yok)
  7. 20 km içinde bekleme paterni (yanlış eşik yok)
  8. 600 ft'te sinyal kaybı, sonra yerde görünme → `probable_landing` → `touchdown` doğrulaması, ikinci push yok
  9. SAW'a iniş (IST için olay üretmemeli)
  10. rotası bilinmeyen varış
  11. **IST finalinde 3 uçak varken sağlayıcı 120 sn 429 döner** → sıfır push, 3 uygulama içi "doğrulanamadı" kaydı
  12. örnekleme aralığı 5, 10 ve 20 sn iken senaryo 1 ve 2 (teker koyma toleransı = aralık + 5 sn)
- **Kabul:** `engine` ve `geo` paketlerinde vitest `coverage.thresholds.lines = 90` CI'da zorlanır. Tüm senaryolar geçer. Senaryo 5, 6, 7, 9 ve 11'de yanlış alarm yoktur.

### M2 — Referans, rota, METAR ve irtifa (`p2/m2-reference`)
- **VRS standing-data içe aktarımı** (data-sources.md §4): havayolları (ICAO, IATA, ad, `usesAlphanumericCallsigns`) ve rotalar. Günlük, ETag ile. Admin düzeltme tabloları: havayolu eşleme ve pist.
- **Rota tahmini:** çağrı kodundan rota bulunur ve uygunluk yerelde hesaplanır. Sonuç "tahmini" olarak işaretlenir. Negatif önbellek her günlük içe aktarımda tazelenir.
- **Sefer no → çağrı kodu adayı:** TK1985 → THY1985 (IATA tekil değildir; data-sources.md §4 kuralı).
- **METAR/TAF** (data-sources.md §5):
  - Etkin istasyonlar tek istekte çekilir: METAR 10 dk'da bir, TAF 60 dk'da bir. `upsertJobScheduler` kullanılır.
  - Ayrıştırılan alanlar: QNH (`altim` hPa), rüzgâr, görüş, tavan, ham metin.
- **AGL tahmini** — sırayla dene:
  1. `alt_baro` + QNH düzeltmesi (≈ 27 ft/hPa, 1013,25 referans) − alan yüksekliği.
  2. QNH yoksa: `alt_geom_ft − N_m × 3,28084 − alan_yüksekliği_ft`. Geoid ondülasyonu `egm96-universal` `meanSeaLevel(lat, lon)` ile istasyon başına bir kez hesaplanır ve `stations.geoid_undulation_m`'de saklanır. Paket yalnızca engine/worker'da kullanılır, web bundle'ına girmez.
  3. İkisi de yoksa `alt_baro` ile toleranslı eşikler.

  Kullanılan yöntem olay verisine yazılır.
- **Kabul:**
  - Birim testleri: LTFM için N ≈ 37,05 m, SAW ≈ 37,61 m, AYT ≈ 27,36 m (±0,5 m).
  - METAR ayrıştırıcısı gerçek fixture'larla test edilir.
  - VRS içe aktarımı idempotenttir. AJet (TKJ/VF) ve THY (THY/TK) doğru eşlenir.

### M3 — Motor worker'ı (`p2/m3-engine-worker`)
- Worker `engine` rolü `ac:updates` stream'ini tüketici grubuyla okur. `NOGROUP` hatasında grubu `XGROUP CREATE … MKSTREAM` ile yeniden kurar; askıdaki mesajları `XAUTOCLAIM` ile alır.
- Minimal durum `redis-queue`'da tutulur ve yeniden başlatmada geri yüklenir.
- Olaylar `events` tablosuna yazılır; `flights` özeti güncellenir. Varış/kalkış olarak sınıflanan uçaklar için `track_points_fine` kuralı genişler (domain.md "Saklama").
- **Performans:** `pnpm bench:engine` kayıtlı fixture'ı tek çekirdekte besler; hedef ≥ 2.000 güncelleme/sn. Rapora CPU modeli ve Node sürümü yazılır.
- **Kabul:** Bench hedefi karşılanır. Yeniden başlatma testi geçer: süreç ortada öldürülür, olaylar yinelenmez ve kaybolmaz.

### M4 — Sahibine ilk gerçek bildirim (`p2/m4-owner-push`)
- **Web Push:**
  - VAPID anahtarları `pnpm vapid:generate` ile üretilir. Subject `mailto:` ya da https URL olmalı, localhost olamaz.
  - `web-push@3.6.7` kullanılır. 404/410 yanıtında abonelik silinir.
  - Yük **Declarative Web Push** biçimindedir: `{"web_push":8030,"notification":{title, body, navigate:"/?hex=…", …}}`. Service worker aynı JSON'u Chrome/Firefox/Android için ayrıştırır.
- **Tek işlevsel admin sayfası** `/kurulum/bildirim` (yalnızca `ADMIN_EMAIL`; geçici giriş: e-postaya giden tek seferlik kod). Sayfada:
  - service worker kaydı
  - "Bildirimlere izin ver" düğmesi (izin yalnızca düğmeyle istenir)
  - iOS'ta ana ekrana ekleme yönergesi (standalone değilse)
  - hex, tescil ya da çağrı kodu ile takip ekleme
  - "Test bildirimi gönder"

  Parça 3 bu sayfayı tasarım sistemiyle yeniden yazar. Bu sayfa placeholder sayılmaz.
- Bu kilometre taşında eşleştirici basittir: sahibin takipleri ile olaylar eşlenir → BullMQ `notify` kuyruğu → web push. Tam kurallar 2B'de gelir.
- **Şablonlar** (TR/EN, `packages/i18n`):
  - "TK1985 (TC-JJA) IST'ye 10 km — tahmini iniş 2 dk"
  - "TK1985 IST'de teker koydu — 14:32, pist 34L"
  - "TK1985 IST'ye muhtemelen indi — tahmini 14:32 (yüksek güven)"
  - "TK1985 IST'de pas geçti"
- **Ölçüm:** iki gecikme raporlanır:
  - (a) motorun olayı yayınlaması → push sağlayıcısının 2xx yanıtı; hedef p95 < 3 sn
  - (b) örneğin `sampleTime`'ı → push sağlayıcısının kabulü; tazelik katmanı başına p50/p95
- **Gerçek dünya doğrulaması (kullanıcıyla):**
  - Yayından sonra sahibi en az 20 gerçek IST varışını takip eder.
  - Rapora yazılanlar: telefona ulaşan 10 km ve iniş bildirimleri, `touchdown` / `probable_landing` dağılımı, kaçan ve yanlış olaylar.
  - Sonuç iyi değilse DUR-SOR (eşik ayarı gerekebilir).
- **Kabul:** Stub web push sunucusuna karşı zincir testi geçer: replay → olay → push. Kullanıcı kendi telefonunda test bildirimini alır.

## 2B — Hesaplar, takip, bildirim kanalları, yedekleme

### M5 — Hesaplar ve güvenlik (`p2/m5-auth`)
- **Kimlik doğrulama:**
  - e-posta + şifre (argon2id)
  - 6 haneli e-posta doğrulama kodu (15 dk geçerli)
  - şifre sıfırlama kodu
  - giriş denemesi sınırlaması (sayaçlar `redis-queue`'da, doğru istemci IP'siyle)
- **Oturum:**
  - 15 dk access JWT + 30 gün dönen refresh token.
  - Refresh token DB'de hash'li saklanır. Yeniden kullanım tespit edilirse o token ailesinin tamamı iptal edilir.
  - Web: httpOnly/Secure/SameSite=Lax çerez + CSRF koruması. `COOKIE_DOMAIN` env'den gelir (dev'de boş, host-only). `Secure` yalnızca üretimde zorunludur.
  - Mobil: bearer token + SecureStore.
- **Roller:** `user` ve `admin`. İlk admin seed komutuyla `ADMIN_EMAIL` üzerinden oluşturulur. M4'teki geçici giriş bu sisteme taşınır.
- **KVKK ve mağaza gereklilikleri:**
  - Verilerimi indir (JSON).
  - Hesabımı sil: anında pasifleştirilir. Kalıcı silme job'ı en geç 30 gün içinde kullanıcı, cihazlar, push token'ları, takipler ve bildirimleri siler ya da anonimleştirir. Yedeklerdeki kalış süresi belgelenir.
- **Plan altyapısı:** tek plan `free`. Limitler config'ten gelir (ör. en fazla 20 takip, 5 istasyon akışı, saatlik push sınırı) ve sunucuda zorunlu tutulur. Ödeme arayüzü yoktur.
- **`REGISTRATION_ENABLED`:** üretimde varsayılan `false`. Açılma koşulları: yedek/geri yükleme testi yeşil (M9), yasal metinler yayında (Parça 3) ve kullanıcı onayı (DUR-SOR).
- SMTP ayarları env'den gelir; yerelde Mailpit kullanılır. Kullanıcı verisi tabloları ayrı bir şemadadır (ODbL dökümüne girmez).
- **Kabul:** Integration testleri geçer: kayıt → Mailpit'ten kod → doğrulama → giriş; refresh rotasyonu ve yeniden kullanım tespiti; hesap silme job'ı.

### M6 — Takip, kurallar ve eşleştirici (`p2/m6-follows`)
- Takip türleri ve **eşleşme durumları** (`pending | matched | completed | expired`) domain.md'deki gibidir.
- İstasyon akışı filtreleri: havayolu, tip ve çağrı kodu öneki. Filtreli akışta her olaya push gider; filtresiz akışta push yoktur, yalnızca uygulama içi akış çalışır ve bu kullanıcıya açıkça söylenir.
- **Kural içeriği:**
  - Olaylar: eşik seçimi, teker koyma/muhtemel iniş, pas geçme, kalkış.
  - Mesafe referansı: ARP ya da hizalı eşik.
  - Kanallar: mobil push, web push, uygulama içi.
  - Sessiz saatler (+ "takip ettiğim uçuşun inişi yine gelsin" istisnası).
  - iOS zamana duyarlı bildirim tercihi.
- Takip listesi P1 toplu sorgusunu besler: `WATCH_HEX_LIST` yerine DB kullanılır.
- **Eşleştirici:** olaylar abone indeksleriyle (hex, çağrı kodu, tescil, istasyon + filtre) eşlenir ve bildirim işleri üretilir.
- **Kabul:**
  - Senaryo: TK1985 takibi, uçak THY4KN olarak uçarken `pending` kalır; arama canlı adayı gösterir, kullanıcı seçince `matched` olur.
  - "Gün" sınırı Europe/Istanbul'a göre test edilir.

### M7 — Bildirim kanalları (`p2/m7-notifier`, worker `notifier` rolü)
- **Kuyruk ve sınırlar:** BullMQ kullanılır. Saatlik push sınırı ve özet kuralları domain.md'deki gibidir; açıkça takip edilen uçuşun iniş bildirimi özete çevrilmez.
- **Expo push** (`expo-server-sdk` ^7.2; ESM, Node ≥ 22.12):
  - Gönderim: 100'lük parçalar, `600/sn` sınırı, `TOO_MANY_REQUESTS`'te geri çekilme.
  - Mesaj: `priority: "high"`, `sound: "default"`, `channelId: "flight-alerts"` (Android), `threadId: <flightId>` (iOS), `tag: <flightId>-<event>` (Android). Kullanıcı tercihi açıksa iOS için `interruptionLevel: "time-sensitive"` eklenir.
  - Doğrudan APNs yolu **yazılmaz**; Expo bu alanı destekliyor.
  - Receipt kontrolü 15 dk sonra yapılır (en geç 24 saat). `DeviceNotRegistered` ticket'ta ya da receipt'te gelirse token silinir.
  - `EXPO_ACCESS_TOKEN` (enhanced security) desteklenir.
- **Web Push:** M4'teki gönderici çok kullanıcılı hâle getirilir.
- **Uygulama içi gelen kutusu:** DB'de tutulur, WS ile gerçek zamanlı iletilir. Muhtemel inişte güven düzeyi belirtilir. Kesinti sırasında kaçan olaylar gelen kutusuna "kesinti sırasında" etiketiyle yazılır ve sonradan push olarak gönderilmez.
- **Saat biçimi:** kullanıcının tercihine göre (yerel ya da UTC "Z").
- **Kabul:** Expo ve Web Push göndericilerinin stub sunuculara karşı integration testleri geçer: parçalama, receipt, `DeviceNotRegistered` temizliği, 410 temizliği. Gecikme ölçümü (a) 500 olayda p95 < 3 sn.

### M8 — API uç noktaları (`p2/m8-api`)
- **Hesap:** auth, `me`, ayarlar.
- **Cihaz kayıtları:** Expo token, web push aboneliği.
- **Takip:** takip ve kural CRUD, eşleşme durumu.
- **Bildirimler:** liste, okundu işaretleme.
- **Arama:** sefer no, çağrı kodu, tescil, hex, havalimanı.
- **Uçuş:** detay, iz, olaylar, tahmini rota.
- **İstasyon:**
  - liste
  - varış panosu: yaklaşanlar, mesafe, ETA, durum, kapsama kalitesi
  - **son 2 saatin inişleri ve kalkışları** (pist ve saatle)
  - METAR/TAF
  - operasyon panosu için filtreli akış
- **Admin:** kullanıcılar, sağlayıcı sağlığı, bildirim kayıtları, engel listesi ve kaldırma talepleri, havayolu ve pist düzeltmeleri, limitler, disk kullanımı.
- **WS kanalları** (yetkili): uçak detayı, istasyon panosu, gelen kutusu.
- OpenAPI ve `.env.example` güncel tutulur.

### M9 — Yedekleme ve üretim hazırlığı (`p2/m9-backup`)
- Yedekleme infra.md → "Yedekleme" bölümüne göre kurulur (Dokploy Compose Backups + iz partition arşivi + yerel sınırlı yedek). `scripts/restore.sh` yazılır ve CI'da geri yükleme testi koşar.
- `SENTRY_DSN` tanımlıysa hata takibi açılır. Uyarı job'ı ve heartbeat'ler infra.md → "Gözlem ve uyarı" bölümüne göre kurulur.
- **Kabul:**
  - Yedekten temiz bir DB'ye geri yükleme CI'da geçer.
  - Uyarı job'ı stub SMTP'ye doğru e-postaları gönderir.
  - Kullanıcı Dokploy yedek hedefini kurduktan sonra bir gerçek yedek alınır ve bir kez geri yüklenir (kullanıcıyla).

## Uçtan uca (API seviyesinde)
Kayıt → doğrulama → takibe alma → replay senaryosu → gelen kutusunda doğru olayların doğru sırayla görünmesi ve stub push sunucularında doğru mesajlar.

## Tamamlanma kriterleri
- [ ] Parça 1 kriterleri hâlâ yeşil.
- [ ] Tüm senaryolar geçer. Kalkış, üstten geçiş, bekleme, SAW ve kesinti senaryolarında yanlış alarm yoktur.
- [ ] Sahibi gerçek IST varışlarında telefonuna bildirim aldı. 20 varışlık doğrulama rapora yazıldı.
- [ ] Motor performansı ve iki gecikme metriği ölçülüp raporlandı.
- [ ] Yedek alma ve geri yükleme test edildi. Uyarılar çalışıyor.
- [ ] OpenAPI, `.env.example`, `docs/ACTIVATION.md` ve `docs/reports/parca-2.md` güncel.

## Dış aktivasyon adımları (ACTIVATION'a ekle)
- SMTP hesabı ve SPF/DKIM DNS kayıtları
- VAPID anahtarlarının üretilmesi ve parola yöneticisine yedeklenmesi
- `ADMIN_EMAIL`
- Expo erişim token'ı (Parça 4'te kullanılır)
- S3 uyumlu yedek deposu (B2/R2) ve Dokploy Backups ayarı
- Dış uptime izleme ve heartbeat URL'leri
- Opsiyonel: Sentry
- **Erken başlatılacaklar:** Apple Developer Program üyeliği (kimlik doğrulaması günler sürebilir) ve Google Play Console hesabı. Kişisel Play hesabında üretim için 12 test kullanıcısıyla 14 günlük kapalı test şarttır.
