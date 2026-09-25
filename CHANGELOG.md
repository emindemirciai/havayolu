# Yenilikler / Changelog

> Bu dosya `packages/shared/src/changelog/entries.ts` kaynağından `pnpm changelog` ile üretilir; elle düzenleme.
> Aynı içerik uygulamada **Yenilikler** (`/yenilikler`) sayfasında görünür.
>
> *Generated from `packages/shared/src/changelog/entries.ts` by `pnpm changelog`; do not edit by hand.*
> *The same content appears in the app’s **What’s new** (`/yenilikler`) page.*

---

## v0.2.0 — 2026-09-25

### Türkçe
**İlk yerel test ortamı: Durum ve Yenilikler sayfaları**

- Uygulama artık bilgisayarında tek komutla (pnpm dev) açılıyor. Deploy’u beklemeden her değişikliği yerelde görebilirsin.
- Durum sayfası: uygulama sürümü, sunucu (API) bağlantısı ve yol haritasındaki ilerleme tek ekranda.
- Yenilikler sayfası: her sürümde neler geldiği ve o sürümde deneyebileceğin sayfalara doğrudan bağlantılar.
- Türkçe ve İngilizce arasında tek tıkla geçiş. Seçimin hatırlanır.
- Açık ve koyu tema, sistem ayarına otomatik uyar.
- Proje kodu MIT lisansıyla yayımlandı. Uçuş verisi kendi lisansında (ADSB.lol, ODbL) kalıyor.

Dene: [Durum sayfası](/durum) · [Yenilikler sayfası](/yenilikler)

### English
**First local test environment: Status and What’s new pages**

- The app now starts on your computer with a single command (pnpm dev), so you can see every change locally without waiting for a deploy.
- Status page: app version, server (API) connection and roadmap progress on one screen.
- What’s new page: what arrived in each version, with direct links to the pages you can try in that version.
- One-click switch between Turkish and English. Your choice is remembered.
- Light and dark themes follow your system setting automatically.
- The project code is released under the MIT license. Flight data keeps its own license (ADSB.lol, ODbL).

Try it: [Status page](/durum) · [What’s new page](/yenilikler)

---

## v0.1.0 — 2026-09-25

### Türkçe
**Proje kuruldu ve yol haritası netleşti**

- Uçuş verisinin nereden geleceği belirlendi: canlı konumlar ADSB.lol’den (ücretsiz, ticari kullanıma açık), havalimanı ve pist bilgisi OurAirports’tan, havayolu ve rota tahmini VRS standing-data’dan, hava durumu NOAA’dan.
- Bütün veri kaynakları ve lisansları 2026-09-25 itibarıyla tek tek doğrulandı. Ticari kullanıma izin vermeyen kaynaklar ve Flightradar24’ün resmi API’si kapsam dışı bırakıldı.
- Yayın düzeni tasarlandı: GitHub’a gönderilen kod otomatik test edilir, sonra Dokploy üzerinden yayına alınır.
- Geliştirme 5 parçaya ve kilometre taşlarına bölündü. İlk hedefler sırasıyla canlı harita, “uçağım istasyona 10 km yaklaştı” ve “indi” bildiriminin telefonuna gelmesi, ardından mobil uygulama.
- Bilinen sınır açıkça yazıldı: kendi ADS-B alıcımız olmadığı için inişler çoğu zaman “muhtemelen indi (tahmini saat)” olarak bildirilecek.

### English
**Project set up and roadmap defined**

- Data sources chosen: live positions from ADSB.lol (free, commercial use allowed), airports and runways from OurAirports, airlines and estimated routes from VRS standing-data, weather from NOAA.
- Every data source and its license was verified as of 2026-09-25. Sources that forbid commercial use, and the official Flightradar24 API, are excluded.
- Release pipeline designed: code pushed to GitHub is tested automatically, then deployed through Dokploy.
- Development split into 5 parts with milestones. First goals, in order: the live map, then the “my aircraft is 10 km from the station” and “landed” alerts reaching your phone, then the mobile app.
- Known limitation stated up front: without our own ADS-B receiver, landings will often be reported as “probably landed (estimated time)”.

