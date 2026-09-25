---
paths:
  - "packages/engine/**"
  - "packages/geo/**"
  - "apps/worker/src/engine/**"
  - "apps/worker/src/notifier/**"
---

# Olay motoru kuralları

`docs/spec/domain.md` tek doğru kaynaktır: durumlar, olaylar, eşikler, mesafe referansı, `probable_landing` güven düzeyleri, kesinti bastırma, takip eşleşmesi ve bildirim sınırları.

- `packages/engine` ve `packages/geo` saf kalır: IO, saat okuma ve rastgelelik yoktur. Zaman her zaman örneğin `sampleTime`'ından gelir.
- Motor deterministiktir. Aynı örnek dizisi aynı olayları üretir; bu, senaryo testleriyle korunur.
- Durum ve olay kodları İngilizce ASCII'dir. Türkçe etiketler yalnızca `packages/i18n`'dedir.
- Kapsama gerçeği: IST'de yerde örneği nadirdir. `probable_landing` birinci sınıf bir yoldur ve kendi senaryolarıyla test edilir.
- Sağlayıcı `degraded`/`down` iken ve worker açılışından sonraki ilk 120 sn içinde `probable_landing` push'u üretilmez.
- `engine` ve `geo` paketlerinde satır kapsamı ≥ %90'dır (vitest threshold).
