---
paths:
  - "packages/providers/**"
  - "apps/worker/src/ingest/**"
  - "tools/**"
---

# Sağlayıcı ve ingest kuralları

Bu dizinlerde çalışırken `docs/spec/data-sources.md` tek doğru kaynaktır. Kritik noktalar:

- adsb.lol'e her istekte açık, tanımlayıcı bir User-Agent gönderilir. Node'un varsayılan `node` UA'sı 403 alır.
- Durum kodu JSON ayrıştırmadan önce kontrol edilir. 429/420 HTML gövdeli gelir ve Retry-After taşımaz. 401/403 kısıtlama değil, yapılandırma ya da politika hatasıdır: devre açılır, döngüde yeniden denenmez.
- `now` adsb.lol'de milisaniye, readsb `aircraft.json`'da saniyedir. `seen_pos` her ikisinde de saniyedir.
- `lastPosition`, `rr_lat`/`rr_lon` ve `mlat`/`tisb_*`/`other` kaynakları olay tespitinde kullanılmaz ya da düşük ağırlık alır.
- `routeset`/`route` uç noktaları çağrılmaz. Rota için VRS standing-data kullanılır.
- Testler ve CI canlı API'ye istek atmaz. `tools/` altındaki canlı araçlar (`record`, `smoke:live`, `coverage:probe`) hız kurallarına uyar ve yalnızca elle çalıştırılır.
- Yeni bir sağlayıcı eklemek = lisans kaydı (`commercialUse`, `attribution`, `shareAlike`, `rateLimit`, `b2cDisplayAllowed`, `mixingWithOtherRealtimeAllowed`, `maxRawStorageDays`) + DUR-SOR.
