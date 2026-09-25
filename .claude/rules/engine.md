---
paths:
  - "packages/engine/**"
  - "packages/geo/**"
  - "apps/worker/src/engine/**"
  - "apps/worker/src/notifier/**"
---

# Olay motoru kuralları

`docs/spec/domain.md` tek doğru kaynaktır: terimler, durumlar ve giriş koşulları, tespit eşikleri, AGL yöntemi, `high/medium/low` güven, kesinti bastırma, takip eşleşmesi ve bildirim sınırları. Parça prompt'ları eşikleri tekrar etmez.

- `packages/engine` ve `packages/geo` saf kalır: IO, saat okuma ve rastgelelik yoktur. Zaman her zaman örneğin `sampleTime`'ından gelir.
- Motor deterministiktir. Aynı örnek dizisi aynı olayları üretir; bu, senaryo testleriyle korunur.
- Durum ve olay kodları İngilizce ASCII'dir. Türkçe etiketler yalnızca `packages/i18n`'dedir.
- Kapsama gerçeği: IST'de yerde örneği nadirdir. `probable_landing` birinci sınıf bir yoldur ve kendi senaryolarıyla test edilir.
- Kesinti bastırma: şunlardan **herhangi biri** geçerliyken `LOW_ALT_LOST → PROBABLE_LANDING` geçişi yapılmaz: sağlayıcı `degraded`/`down`; bölgesel tazelik hedefin 2 katını aşmış; worker açılalı 120 sn olmamış (domain.md → "İniş tespiti").
- Takip hiçbir zaman sessizce kapanmaz: iniş olayı üretmeden biten eşleşmiş takip `landing_unknown` ile kapanır ve bildirim üretir.
- `engine` ve `geo` paketlerinde satır kapsamı ≥ %90'dır (vitest threshold).
