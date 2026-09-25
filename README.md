# ucus-takip

**[Türkçe](#türkçe) · [English](#english)**

![sürüm](https://img.shields.io/badge/s%C3%BCr%C3%BCm-v0.1.0-blue) ![durum](https://img.shields.io/badge/durum-kurulum-lightgrey)

---

## Türkçe

Türkiye odaklı sivil havacılık uçuş takip platformu. Canlı harita, uçuş, uçak ve istasyon takibi sunar. Uçak istasyona yaklaşınca (varsayılan 10 km) ve indiğinde bildirim gönderir. Önce web (PWA) gelir, ardından iOS ve Android uygulaması (Expo).

> Kod adı `ucus-takip`'tir. Uygulama adı ve domain henüz seçilmedi (bkz. `docs/DECISIONS.md` D-001).

### Durum — v0.1.0
| Alan | Durum |
|---|---|
| Yol haritası, veri kaynakları, mimari | ✅ Hazır ve doğrulandı |
| Yayın hattı (GitHub Actions → GHCR → Dokploy) | ⏳ Parça 1 · M1 |
| Canlı harita ve arama | ⏳ Parça 1 · M6 |
| 10 km ve iniş bildirimi (web push) | ⏳ Parça 2 · M4 |
| Hesaplar, takip listesi, istasyon operasyon panosu | ⏳ Parça 2B / 3 |
| iOS ve Android uygulaması | ⏳ Parça 4 |

Sürüm geçmişi için [CHANGELOG.md](CHANGELOG.md) dosyasına bak. Uygulama içinde aynı içerik **Yenilikler** sayfasında görünecek.

### Yerelde çalıştırma
Kod iskeleti Parça 1 · M0 ile geliyor. O zaman:

```bash
pnpm install
pnpm dev
```

Sonra `http://localhost:3000/yenilikler` adresini aç. Ayrıntılı komutlar `CLAUDE.md` → Komutlar bölümünde.

### Proje nasıl geliştiriliyor
- `docs/prompts/README.md`: parçaları Claude Code ile nasıl çalıştıracağın
- `CLAUDE.md`: proje kuralları · `docs/spec/`: alan, veri kaynakları, altyapı
- `docs/ACTIVATION.md`: senin elle yapacağın dış adımlar (Dokploy, DNS, mağaza hesapları…)
- `docs/DECISIONS.md`: kararlar ve gerekçeleri

### İstatistik
v0.1.0 itibarıyla git'te 31 dosya var. Toplam **3.984 satır**; araştırma notları hariç **1.517 satır** (yalnızca belge ve yapılandırma, henüz uygulama kodu yok).

### Veri ve atıflar
- Canlı uçuş verisi: [ADSB.lol](https://adsb.lol), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) lisansıyla.
- Harita: OpenFreeMap © OpenMapTiles, veriler © OpenStreetMap katkıcıları.
- Havalimanları: OurAirports (kamu malı). Havayolu ve rotalar: VRS standing-data (CC0). Hava durumu: NOAA Aviation Weather Center.

---

## English

A Türkiye-focused civil aviation flight tracker. It offers a live map and lets you follow flights, aircraft and stations. You get an alert when an aircraft approaches a station (10 km by default) and when it lands. The web app (PWA) comes first, then iOS and Android apps (Expo).

> The code name is `ucus-takip`. The product name and domain are not chosen yet (see `docs/DECISIONS.md` D-001).

### Status — v0.1.0
| Area | Status |
|---|---|
| Roadmap, data sources, architecture | ✅ Done and verified |
| Release pipeline (GitHub Actions → GHCR → Dokploy) | ⏳ Part 1 · M1 |
| Live map and search | ⏳ Part 1 · M6 |
| 10 km and landing alerts (web push) | ⏳ Part 2 · M4 |
| Accounts, watchlist, station operations board | ⏳ Part 2B / 3 |
| iOS and Android apps | ⏳ Part 4 |

See [CHANGELOG.md](CHANGELOG.md) for release history. The same content will appear in the app's **What's new** page.

### Run locally
The code skeleton arrives with Part 1 · M0. Then:

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000/yenilikler`. Full command list: `CLAUDE.md` → Komutlar.

### How the project is built
- `docs/prompts/README.md`: how to run each part with Claude Code
- `CLAUDE.md`: project rules · `docs/spec/`: domain, data sources, infrastructure
- `docs/ACTIVATION.md`: manual external steps (Dokploy, DNS, store accounts…)
- `docs/DECISIONS.md`: decisions and rationale

### Stats
As of v0.1.0, 31 files are tracked in git. **3,984 lines** in total; **1,517 lines** excluding research notes (documents and configuration only, no application code yet).

### Data and attribution
- Live flight data: [ADSB.lol](https://adsb.lol), under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
- Map: OpenFreeMap © OpenMapTiles, data © OpenStreetMap contributors.
- Airports: OurAirports (public domain). Airlines and routes: VRS standing-data (CC0). Weather: NOAA Aviation Weather Center.
