---
paths:
  - "apps/web/**"
  - "packages/i18n/**"
---

# Web arayüz kuralları

- `docs/DESIGN.md` varsa (Parça 3'ten itibaren) renk, tipografi ve bileşen token'ları oradan gelir. Token'ların kaynağı `packages/shared/design-tokens`'tır.
- Sabit metin yoktur; tüm metinler `packages/i18n`'dedir (tr varsayılan, en ikinci). Tahmini bilgi "tahmini" etiketi taşır.
- MapLibre GL JS v6 ESM-only'dir ve WebGL2 gerektirir; yalnızca client component'te yüklenir. `setData` ikinci argüman almaz.
- Uçak katmanı tek bir symbol katmanıdır. Stil JSON'u `packages/shared`'dadır ve mobille ortaktır.
- Next.js 16: `publicRuntimeConfig` yoktur, `middleware` yerine `proxy` kullanılır, `next lint` yoktur. Ortama özgü yapılandırma çalışma zamanında sunucudan okunur; `NEXT_PUBLIC_*` kullanılmaz.
- Atıflar (ADSB.lol ODbL bağlantılı, OpenMapTiles/OSM) haritada her zaman görünür.
- Erişilebilirlik WCAG 2.1 AA'dır; panolarda gerçek `<table>` yapısı kullanılır.
