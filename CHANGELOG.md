# Yenilikler / Changelog

Her sürümde uygulamaya neler geldiğini buradan takip edebilirsin. Parça 1 M0'dan itibaren bu dosya `packages/shared/src/changelog/entries.ts` kaynağından `pnpm changelog` ile üretilir ve aynı içerik uygulamada **Yenilikler** (`/yenilikler`) sayfasında görünür.

*Track what's new in each version here. From Part 1 M0 on, this file is generated from `packages/shared/src/changelog/entries.ts` via `pnpm changelog`, and the same content appears in the app's **What's new** (`/yenilikler`) page.*

---

## v0.1.0 — 2026-09-25

### Türkçe
**Proje kuruldu ve yol haritası netleşti.** Henüz çalışan bir uygulama yok; bu sürüm temeli atıyor.
- Uçuş verisinin nereden geleceği belirlendi: canlı konumlar ADSB.lol'den (ücretsiz, ticari kullanıma açık), havalimanı ve pist bilgisi OurAirports'tan, havayolu ve rota tahmini VRS standing-data'dan, hava durumu NOAA'dan.
- Bütün veri kaynakları ve lisansları 2026-09-25 itibarıyla tek tek doğrulandı. Ticari kullanıma izin vermeyen kaynaklar ve Flightradar24'ün resmi API'si kapsam dışı bırakıldı.
- Yayın düzeni tasarlandı: GitHub'a gönderilen kod otomatik test edilir, sonra Dokploy üzerinden yayına alınır.
- Geliştirme 5 parçaya ve kilometre taşlarına bölündü. İlk hedefler sırasıyla canlı harita, "uçağım istasyona 10 km yaklaştı" ve "indi" bildiriminin telefonuna gelmesi, ardından mobil uygulama.
- Bilinen sınır açıkça yazıldı: kendi ADS-B alıcımız olmadığı için inişler çoğu zaman "muhtemelen indi (tahmini saat)" olarak bildirilecek.

### English
**Project set up and roadmap defined.** There is no running app yet; this release lays the foundation.
- Data sources chosen: live positions from ADSB.lol (free, commercial use allowed), airports and runways from OurAirports, airlines and estimated routes from VRS standing-data, weather from NOAA.
- Every data source and its license was verified as of 2026-09-25. Sources that forbid commercial use, and the official Flightradar24 API, are excluded.
- Release pipeline designed: code pushed to GitHub is tested automatically, then deployed through Dokploy.
- Development split into 5 parts with milestones. First goals, in order: the live map, then the "my aircraft is 10 km from the station" and "landed" alerts reaching your phone, then the mobile app.
- Known limitation stated up front: without our own ADS-B receiver, landings will often be reported as "probably landed (estimated time)".
