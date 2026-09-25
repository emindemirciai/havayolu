# Parça 5 (opsiyonel) — Tarife verisi ve ödeme

> Bu parça, kullanıcı bütçe ayırmaya karar verdiğinde başlatılır. O zamana kadar kodda yalnızca `ScheduleProvider` **tip** arayüzü bulunur (Parça 1 M3). Başlamadan önce DUR-SOR: hangi sağlayıcı, hangi bütçe, hangi plan yapısı?

## Neden gerekli
ADS-B tarife vermez. FR24 premium'daki şu özellikler yalnızca bir tarife sağlayıcısıyla mümkündür:
- tarifeli/tahmini saatler, rötar
- kapı/terminal/bagaj
- kalkış öncesi pano
- harfli çağrı kodlu seferlerin kalkış öncesi eşleşmesi

## Aday sağlayıcılar (fiyatlar 2026-09, `docs/spec/data-sources.md` §7)
1. **AeroDataBox:** ~19 $/ay'dan başlar. B2C gösterim izinlidir. İlk aday.
2. **AirLabs** (49–99 $/ay) ya da **Aviationstack** (49,99–149,99 $/ay): B2C gösterim için yazılı onay alınır.
3. **FlightAware AeroAPI Standard** (en az 100 $/ay; `on`/`in` webhook alarmı var): adsb.lol ile birlikte kullanım için **FlightAware'in yazılı izni şarttır** (lisans md. 10).
4. **Flightradar24 API kullanılmaz** (ToS 6.3.1: rakip ürün geliştirmek ve başka kaynağı tamamlamak yasak).

## Kapsam (başlatıldığında)
- `ScheduleProvider` uygulaması. Lisans kaydı zorunlu alanları doldurulur: `commercialUse`, `b2cDisplayAllowed`, `mixingWithOtherRealtimeAllowed`, `maxRawStorageDays`. `DATA_USAGE_MODE` denetimi uygulanır.
- Sefer no → çağrı kodu/tescil çözümleme. Bu, harfli çağrı kodu sorununu çözer ve `pending` takiplerin eşleşmesini hızlandırır.
- İstasyon panosuna STA/ETA, kapı ve rötar sütunları; kalkış panosu.
- Ham veri saklama süresi sağlayıcı şartına göre sınırlanır ve ayrı tablolarda tutulur.
- **Ödeme:**
  - web: ödeme sağlayıcısı (ör. iyzico / Stripe)
  - iOS: özellik kilidi açmak için In-App Purchase zorunludur (App Review 3.1.1)
  - Android: Play Billing

  Plan yapısı `free` + ücretli katman olur; limitler config'ten gelir. Ücret veriye değil özelliklere alınır (ODbL 4.7).
- **DUR-SOR noktaları:** sağlayıcıdan yazılı onay, ödeme hesabı açılışı, fiyatlandırma.
