# Parça 2/4 — Olay motoru, hesaplar, takip ve bildirimler

Önce `CLAUDE.md` ve `docs/reports/parca-1.md` dosyalarını oku.

**Hedef:** Kullanıcı hesap açar; bir uçuşu, uçağı ya da istasyonu takibe alır. Uçak seçilen eşiğe girdiğinde ve teker koyduğunda şu kanallardan bildirim üretilir:
- web push
- mobil push (Expo gönderimi; uygulamanın kendisi Parça 4'te)
- uygulama içi bildirim

Bu parçada yeni web ekranı eklenmez. Tüm akışlar API ve entegrasyon testleriyle doğrulanır; ekranlar Parça 3'te.

## 1. Referans ve eşleme
**Havayolu kod eşlemesi** (IATA ↔ ICAO, çağrı kodu öneki):
- Kaynak: OpenFlights airlines verisi (ODbL; atıf ver).
- Admin için ayrıca bir düzeltme tablosu olsun.

**Sefer numarasından çağrı kodu adayı:** TK1985 → THY1985.

**Harf içeren çağrı kodları** (ör. THY4KN) sefer numarasından türetilemez. Bu durumda:
- Aramada canlı adayları göster (tescil ve tahmini rota ile).
- Kullanıcının doğru uçağı seçmesine izin ver.

## 2. Rota tahmini
- **Kaynak:** adsb.lol routeset (şemayı `/docs`'tan doğrula). Çağrı kodu + konum ile toplu sorgu yapılır.
- **Önbellek:** Çağrı kodu başına 6 saat; ayrıca negatif önbellek.
- **Güven:** Uçağın konumu ve ilerleyişi rotaya uymuyorsa rota düşük güvenli sayılır.
- **Gösterim:** Sonuç her yerde "tahmini" olarak işaretlenir.

## 3. METAR/TAF ve irtifa düzeltmesi
**Veri çekimi.** aviationweather.gov Data API'den etkin istasyonlar için:
- METAR: 10 dakikada bir
- TAF: 60 dakikada bir
- Kurallar: dakikada en fazla 100 istek, özel User-Agent.
- Ayrıştırılacak alanlar: QNH, rüzgâr, görüş, tavan, ham metin.

**Alan üstü yükseklik tahmini** — şu sırayla dene:
1. `alt_baro` + QNH düzeltmesi (≈27 ft/hPa).
2. QNH yoksa `alt_geom` − istasyonun geoit ondülasyonu (EGM96; istasyon başına bir kez hesaplanır).
3. İkisi de yoksa `alt_baro` ile toleranslı eşikler.

Kullanılan yöntem olay verisine yazılır.

## 4. Olay motoru (`packages/engine` saf; worker `engine` rolü)
**Girdi:** `ac:updates` stream'i. Her uçak için tutulanlar:
- son N örneklik halka tampon
- uçuş örneği
- aday istasyonlar

**Her örnekte hesaplanan metrikler:**
- ARP'a ve pist eşiklerine yatay mesafe ve yön
- yumuşatılmış yaklaşma hızı ve ETA
- alan üstü yükseklik
- yumuşatılmış dikey hız
- pist hizası: track ile pist yönü farkı ≤15° ve merkez hattından yanal sapma ≤1 km

**Varış sınıflandırması.** Aşağıdakilerden biri sağlanırsa uçak varışta sayılır:
- Tahmini rotanın varış meydanı bu istasyon.
- Alan üstü < 10.000 ft, yumuşatılmış dikey hız < −300 fpm ve mesafe azalıyor.
- 15 km içinde pist hizasında ve alan üstü < 4.000 ft.

**Kalkış ayrımı:** İstasyondan havalanan uçak 10 dakika boyunca o istasyon için yaklaşma olayı üretmez.

**Durumlar:**
- SEYİRDE → YAKLAŞMADA → TEKER_KOYDU → YERDE
- YAKLAŞMADA → PAS_GEÇTİ → yeni yaklaşma
- YAKLAŞMADA → ALÇAKTA_KAYIP → MUHTEMEL_İNİŞ → (doğrulanırsa) TEKER_KOYDU

**Olaylar:**
- **`approach_threshold`:** `CLAUDE.md`'deki hazır eşiklerin her biri için bir kez tetiklenir.
- **`touchdown`:**
  - Koşul: havada → yerde geçişi; ARP'a ≤6 km ya da pist poligonunun 300 m tamponu içinde; gs < 180 kt.
  - Doğrulama: 15 sn içinde ikinci bir yerde örneği ya da azalan gs.
  - Zaman: ilk yerde örneğinin `sampleTime`'ı (ALDT).
  - Hizalı pist belirlenir (ör. "34L").
- **`probable_landing`:**
  - Koşul: YAKLAŞMADA durumundayken son örnekte alan üstü < 1.000 ft, ARP'a ≤8 km, alçalıyor ve ≥90 sn veri yok.
  - Güven düzeyi: "orta".
  - Uçak sonra yerde görülürse aynı kayıt `touchdown` olarak doğrulanır. Yeni push gitmez, yalnızca uygulama içi kayıt güncellenir.
- **`go_around`:**
  - Koşul: YAKLAŞMADA (≤10 km ya da finalde) iken iniş olmadan ≤60 sn içinde ≥400 ft tırmanış ve dikey hız > +500 fpm.
  - Sonraki yaklaşma denemesi eşik olaylarını yeniden üretebilir.
- **`takeoff`:** İstasyonda yerde → havada geçişi. Opsiyonel bir abonelik türüdür.

**İdempotensi ve determinizm:**
- Benzersiz anahtar: `(flight_instance, station, event_type, threshold_key, attempt_no)`.
- Olay zamanları `sampleTime`'dan alınır; sıra dışı gelen eski örnekler atlanır.
- Motor deterministiktir: aynı örnek dizisi her zaman aynı olayları üretir.
- Yeniden başlatmada minimal durum Redis'ten geri yüklenir.

**Performans:** Saniyede 2.000 durum güncellemesini işleyebilmeli. Ölç ve raporla.

## 5. Hesaplar ve güvenlik (`apps/api`)
**Kimlik doğrulama:**
- E-posta + şifre (argon2id).
- 6 haneli e-posta doğrulama kodu (15 dk geçerli).
- Şifre sıfırlama kodu.
- Giriş denemesi sınırlama.

**Oturum yönetimi:**
- 15 dakikalık access JWT + 30 günlük dönen (rotating) refresh token.
- Refresh token DB'de hash'li saklanır. Yeniden kullanım tespit edilirse o token ailesinin tamamı iptal edilir.
- Web: `.DOMAIN` için httpOnly/Secure/SameSite=Lax çerez + CSRF koruması.
- Mobil: bearer token + SecureStore.

**Roller:** `user` ve `admin`. İlk admin, seed komutuyla `ADMIN_EMAIL` üzerinden oluşturulur.

**KVKK ve uygulama mağazası gereklilikleri:**
- Verilerimi indir (JSON).
- Hesabımı sil: hesap anında pasifleştirilir; kalıcı silme job'ı en geç 30 gün içinde çalışır.

**Plan altyapısı:**
- Şimdilik tek plan var: `free`.
- Limitler config'ten gelir (ör. en fazla 20 takip, 5 istasyon) ve sunucu tarafında zorunlu tutulur.
- Ödeme ya da yükseltme arayüzü yoktur.

**Diğer:**
- Opsiyonel: `TURNSTILE_*` tanımlıysa kayıtta bot koruması.
- SMTP ayarları env'den gelir; yerelde Mailpit kullanılır.

## 6. Takip ve uyarı kuralları
**Takip türleri:**
- Uçuş: sefer no ya da çağrı kodu ile; belirli bir tarih ya da "bir sonraki uçuş".
- Uçak: tescil ya da hex ile; sürekli.
- İstasyon akışı: istasyona gelen trafik; filtreler havayolu, tip ve çağrı kodu öneki.

**Yoğun istasyon koruması:**
- Filtresiz istasyon akışında push'a izin verme; yoğun meydanlarda bu saatte onlarca bildirim demektir.
- Filtresizken yalnızca uygulama içi akış çalışır ve kullanıcıya bu açıkça söylenir.

**Kural içeriği:**
- Olaylar: eşik seçimi, teker koyma, pas geçme, kalkış.
- Kanallar: mobil push, web push, uygulama içi.
- Sessiz saatler.
- iOS "zamana duyarlı" bildirim tercihi.

**Bağlantılar:**
- Takip listesi, Parça 1'deki P1 toplu sorgusunu besler.
- Eşleştirici olayı abone indeksleriyle (hex, çağrı kodu, tescil, istasyon) eşler ve bildirim işleri oluşturur.

## 7. Bildirimler (worker `notifier` rolü)
**Kuyruk ve sınırlar:**
- BullMQ kuyruğu kullanılır.
- Kullanıcı başına saatlik bir push sınırı vardır. Sınır aşılırsa bildirim uygulama içine yazılır ve özet gönderilir.

**Expo push:**
- expo-server-sdk ile parçalı gönderim.
- Ticket/receipt kontrol job'ı; `DeviceNotRegistered` token'larının temizlenmesi.
- `EXPO_ACCESS_TOKEN` desteği.
- Android: `channelId: flight-alerts` (yüksek önem).
- iOS zamana duyarlı gönderim:
  - Expo push API'nin güncel dokümanında `interruptionLevel` desteğini doğrula.
  - Destek yoksa iOS için APNs'e doğrudan (token tabanlı .p8) gönderim yolunu uygula ve DECISIONS'a yaz.

**Web Push:**
- VAPID anahtarları (`pnpm vapid:generate` script'i).
- 404/410 yanıtında abonelik temizlenir.

**Uygulama içi gelen kutusu:** DB'de tutulur, WS ile gerçek zamanlı iletilir.

**Şablonlar (TR/EN, sade dil).** Saat, kullanıcının tercihine göre yazılır (yerel ya da UTC "Z"). Örnekler:
- "TK1985 (TC-JJA) IST'ye 10 km — tahmini iniş 2 dk"
- "TK1985 IST'de teker koydu — 14:32, pist 34L"
- "TK1985 IST'de pas geçti"
- Muhtemel inişte güven düzeyi belirtilir.

**Gecikme hedefi:** Olaydan push sağlayıcısına teslime p95 < 3 sn. Ölç ve raporla.

## 8. API uç noktaları
- **Hesap:** auth, `me`.
- **Cihaz kayıtları:** Expo token, web push aboneliği.
- **Takip:** takip ve kural CRUD.
- **Bildirimler:** liste, okundu işaretleme.
- **Arama:** sefer no, çağrı kodu, tescil, hex, havalimanı.
- **Uçuş:** detay, iz, olaylar.
- **İstasyon:**
  - liste
  - varış panosu: yaklaşanlar, ETA ve durum
  - son inişler
  - METAR/TAF
- **Admin:**
  - kullanıcılar
  - sağlayıcı sağlığı
  - bildirim kayıtları
  - engel listesi ve kaldırma talepleri
  - havayolu eşleme düzeltmeleri
  - limitler
- **WS kanalları** (yetkili): uçak detayı, istasyon panosu, gelen kutusu.

## 9. Senaryolar ve kayıt (yalnızca dev/test)
**Sentetik senaryolar** (IST pistleri üzerinde):
- düz ILS yaklaşması ve iniş
- pas geçme + ikinci yaklaşmada iniş
- kalkış
- FL350'de üstten geçiş
- 20 km içinde bekleme paterni
- 600 ft'te sinyal kaybı, sonra yerde görünme
- SAW'a iniş (IST için olay üretmemeli)
- rotası bilinmeyen varış

**Gerçek veri kaydı:** `pnpm record --station LTFM --minutes 30` komutu adsb.lol'den gerçek kareleri, limitlere uyarak fixture'a kaydeder.

**Doğrulama:** Her senaryo beklenen olay listesi ve zaman toleransıyla test edilir (ör. teker koyma ±5 sn).

## 10. Testler
**Kapsam:** `engine` ve `geo` paketlerinde ≥%90 satır kapsamı; tüm senaryolar geçmeli.

**Integration:**
- auth akışları (Mailpit ile)
- refresh rotasyonu ve yeniden kullanım tespiti
- takip → olay → bildirim zinciri (replay ile)
- Expo ve Web Push göndericileri (test sunucusuna karşı)
- limitler ve engel listesi

**API seviyesinde uçtan uca akış:**
1. Kayıt
2. Doğrulama
3. Takibe alma
4. Replay senaryosu
5. Gelen kutusunda doğru olayların doğru sırayla görünmesi

## Tamamlanma kriterleri
- [ ] Parça 1 kriterleri hâlâ yeşil.
- [ ] Tüm senaryolar beklenen olayları üretiyor.
- [ ] Kalkış, üstten geçiş, bekleme ve SAW senaryolarında yanlış alarm yok.
- [ ] Motor performansı ve bildirim gecikmesi ölçülüp raporlandı.
- [ ] OpenAPI ve `.env.example` güncel.
- [ ] `docs/reports/parca-2.md` yazıldı.

## Dış aktivasyon adımları
- SMTP hesabı ve SPF/DKIM DNS kayıtları
- VAPID anahtarları
- `ADMIN_EMAIL`
- Expo erişim token'ı
- Opsiyonel: Turnstile anahtarları
