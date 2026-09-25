# Parça 4/4 — Mobil uygulama, mağaza hazırlığı ve üretim sertleştirme

Önce `CLAUDE.md` dosyasını ve Parça 1–3 raporlarını oku. Bu parça bittiğinde:
- iOS ve Android uygulamaları mağaza incelemesine gönderilebilir durumdadır.
- Sistem üretimde yedekli, izlenebilir ve belgelenmiştir.

## 1. Expo uygulaması (`apps/mobile`)

### Temel kurulum
- Güncel stabil Expo SDK, Expo Router ve TypeScript kullan.
- Development build kullan: MapLibre native modül gerektirdiği için Expo Go hedeflenmez.
- `@maplibre/maplibre-react-native` sürümünün seçilen SDK ve New Architecture ile uyumunu doğrula.

### Tasarım
- `DESIGN.md` token'larını native'e uyarla.
- Platform alışkanlıklarına uy: alt sayfa, geri hareketi, dinamik yazı boyutu.

### Ekranlar
- Harita: web'deki filtre ve katmanlarla.
- Arama.
- Uçuş detayı: alt sayfa + tam ekran.
- İstasyon panosu.
- Takip listesi ve kural düzenleme.
- Bildirim merkezi.
- Ayarlar: sade/uzman, birimler, yerel/UTC, tema, dil.
- Hesap: verilerimi indir, hesabı sil (mağaza zorunluluğu).
- Kimlik ekranları ve kısa tanıtım.

### Bildirimler
**İzin ve token:**
- İzin, kullanıcı ilk takip kuralını oluştururken bağlamıyla birlikte istenir.
- Expo push token'ı kaydedilir, yenilenir ve gerektiğinde silinir.

**Davranış:**
- Uygulama ön plandayken de bildirim gösterilir.
- Bildirime dokununca ilgili uçuşa derin bağlantıyla gidilir.
- Eylem düğmeleri: "Uçuşu aç", "Bu uçuş için sustur".

**Platform ayarları:**
- Android kanalları: `flight-alerts` (yüksek önem) ve `general`.
- iOS: zamana duyarlı bildirim yetkisi (entitlement) ve kullanıcı tercihi.

### Derin bağlantılar
- Uçuş sayfası URL'leri için iOS Universal Links ve Android App Links kur.
- `apple-app-site-association` ve `assetlinks.json` dosyalarını web tarafı env değerleriyle sunar.

### Canlı veri
- WS bağlantısı koparsa üstel beklemeyle yeniden bağlan.
- Uygulama ön plana dönünce veriyi tazele.
- Son durumu önbellekte tut; ağ yokken açıklayıcı bir durum göster.

### Konum izni
Konum izni istenmez; bu sürümde gerekmiyor.

## 2. EAS ve mağaza hazırlığı

### `eas.json`
- Profiller: development, preview, production.
- `runtimeVersion` politikası: fingerprint.
- EAS Update kanalları. Production'a OTA güncelleme yalnızca native değişiklik yoksa gönderilir.

### `app.config.ts`
- Bundle id/package, API URL ve derin bağlantı alanı env'den gelir.
- Yalnızca gereken minimum izinler istenir.
- Özgün uygulama ikonu, uyarlanabilir Android ikonu ve açılış ekranı hazırlanır.

### `docs/MOBILE_RELEASE.md`
- EAS projesinin oluşturulması.
- APNs anahtarının ve FCM v1 hizmet hesabının EAS'a yüklenmesi.
- `eas build` ve `eas submit` adımları.
- TestFlight ve Play dahili test süreci.
- Mağaza metinleri (TR/EN).
- App Store gizlilik etiketleri ve Google Play veri güvenliği formu için yanıtlar. Yanıtlar uygulamanın gerçek veri akışlarından hazırlanır.

### `.github/workflows/mobile.yml`
EAS build, submit ve update iş akışları. Yalnızca elle tetiklenir.

## 3. Mobil testler

### Birim ve bileşen testleri
jest-expo + React Native Testing Library ile:
- bileşenler
- hook'lar
- bildirim yönlendirme mantığı

### Maestro akışları
Replay ile çalışan dev backend'e karşı çalıştırılır:
- Giriş → uçak ara → takibe al → uygulama içi bildirimi gör → uçuş detayına git.
- Hesap silme akışı.

### Gerçek cihaz kontrol listesi
Sonuçları rapora yaz:
- push bildirimleri
- derin bağlantılar
- zamana duyarlı bildirim

## 4. Üretim sertleştirme

### Yedekleme
- `backup` servisi her gün `pg_dump` alır ve S3 uyumlu depolamaya yükler.
- Saklama: 7 günlük + 4 haftalık.
- S3 tanımlı değilse yedeği yerel volume'a yazar ve admin panelinde uyarı gösterir.
- `scripts/restore.sh` hazırlanır; CI'da geri yükleme testi çalışır.

### Gözlemlenebilirlik
- Yapılandırılmış loglar.
- Korumalı `/metrics` uç noktası (Prometheus formatı).
- Admin panelinde sistem sağlığı.
- `SENTRY_DSN` tanımlıysa hata takibi.

### Güvenlik
- CSP ve güvenlik başlıkları.
- Hız limitlerinin gözden geçirilmesi.
- CI'da bağımlılık denetimi.
- Root olmayan konteynerler; mümkün olan yerde salt okunur dosya sistemi.

### Kaynaklar ve yük testi
- KVM 2 için bellek limitlerini ölçüme göre ayarla.
- Yük testi senaryoları:
  - WS'de 1.000 eşzamanlı istemci
  - ingest'te 2.000 uçak
- Sonuçları rapora yaz.

### `docs/RUNBOOK.md`
Şu durumlar için adım adım prosedür içerir:
- sağlayıcı kesintisi ve 429 fırtınası
- Redis veya DB sorunları
- disk dolması
- yedekten geri dönüş
- yeni sağlayıcı ekleme (ticari lisanslı bir sağlayıcıya geçiş dahil)

## Tamamlanma kriterleri
- [ ] Önceki tüm kriterler yeşil.
- [ ] Mobil birim testleri CI'da çalışıyor.
- [ ] Maestro akışları yerelde geçiyor.
- [ ] Development ve preview build'leri EAS'ta başarılı (kimlik bilgileri girildiğinde).
- [ ] Yedek alma ve geri yükleme test edildi.
- [ ] `docs/reports/parca-4.md` yazıldı.
- [ ] Tüm dış aktivasyon adımları `docs/ACTIVATION.md` içinde tek bir listede toplandı.

## Dış aktivasyon adımları (`ACTIVATION.md` için)
- **Expo:** hesap ve EAS projesi.
- **Apple:**
  - Developer Program üyeliği
  - App Store Connect uygulama kaydı
  - APNs anahtarı
  - zamana duyarlı bildirim yetkisi
- **Google:**
  - Play Console hesabı
  - Firebase projesi ve FCM v1 hizmet hesabı
- **Derin bağlantılar:** Apple Team ID ve Android imza parmak izi.
- **Yedekleme:** S3 uyumlu yedek deposu.
- **Mağaza:** görseller ve metinler.
- **Opsiyonel:** Sentry.
