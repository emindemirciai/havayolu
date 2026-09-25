# Veri kaynakları — doğrulanmış ayrıntılar

Doğrulama tarihi: **2026-09-25**. Canlı istekler ve kaynak kodu/doküman okumasıyla doğrulandı; ham araştırma notları `docs/research/` altındadır. Buradaki bir bilgi gerçekle çelişirse DUR-SOR. Önce yeniden doğrula, sonra bu dosyayı güncelle.

## 1. adsb.lol — tek canlı kaynak

**Erişim ve şartlar**
- Şu an anahtarsızdır. Kendi şartlarında şöyle yazıyor: "In the future, you will require an API key which you can get by feeding to adsb.lol". Üretim kullanıcılarının işletmeciyle iletişime geçmesi isteniyor (info@adsb.lol).
- **Hazırlık:** opsiyonel `ADSBLOL_API_KEY` ve `ADSBLOL_API_KEY_HEADER` env'leri şimdiden desteklenir. Anahtar gelince tek noktadan etkinleşir.
- **User-Agent zorunludur.** Boş UA ve Node'un varsayılan `node` UA'sı HTTP 403 ("User-Agent too generic") alır. Her istekte açıkça gönderilir: `<APP_NAME|ucus-takip>/<sürüm> (+https://<DOMAIN>; <CONTACT_EMAIL>)`. `CONTACT_EMAIL` boşsa ingest başlamaz.
- **CORS yoktur.** Tarayıcı ve mobil istemci doğrudan çağıramaz; yalnızca worker çağırır. Cloudflare Workers gibi sunucusuz çıkışlar ilk istekte 429 alır; kullanılmaz.
- SLA yoktur ("as is"). Durum sayfası: https://status.adsb.lol

**Lisans: ODbL 1.0**
- Ticari kullanıma izin verir.
- **Atıf** (harita, uçuş sayfası, ATTRIBUTION.md): "Canlı uçuş verisi: [ADSB.lol](https://adsb.lol) — [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)". Bağlantılar zorunludur.
- **Türetilmiş veritabanı:** Saklanan konum ve iz tabloları ODbL'ye göre *Derivative Database*'tir. Herkese açık kullanıldıkları için:
  - ODbL altında kalırlar.
  - `/acik-veri` sayfasında günlük ODbL dökümü ya da türetme yöntemini anlatan belge ücretsiz sunulur (md. 4.6).
- Kullanıcı, takip ve fatura tabloları ayrı şemada tutulur ve dökümlere asla girmez; bunlar *Collective Database* sayılır (md. 4.5a).
- Kullanım koşullarımız ADS-B türevi verinin yeniden kullanımını yasaklayamaz (md. 4.7). Ücret veriye değil özelliklere alınır.

**Uç noktalar** (şema: `https://api.adsb.lol/api/openapi.json`; `/docs` sayfası JS ile oluşur ve okunamaz)
- `GET /v2/point/{lat}/{lon}/{radius}`: radius **NM** cinsinden, tamsayı, en fazla **250**. Yanıt `dst` (NM) ve `dir` (derece) alanlarını da içerir.
- `GET /v2/hex/{h1,h2,...}`: **çoklu değer çalışır** (virgülle ayrılır). Çağrı başına en fazla 500 hex, URL ≤ 4 KB.
- `GET /v2/callsign/{cs1,cs2}` ve `GET /v2/reg/{reg}`: çoklu değer desteklenir. `/v2/type/{t}` ve `/v2/sqk/{s}` da vardır.
- `/v2/mil`, `/v2/ladd`, `/v2/pia` tüm dünyayı döndürür; zamanlanmış çekimde kullanılmaz. `/v2/all` kapalıdır (503).
- Değerlerde yalnızca `a-zA-Z0-9,=_.-` karakterlerine izin verilir.
- **Kullanılmaz:** `POST /api/0/routeset` ve `GET /api/0/route/...`. Referer kontrolü yaparlar (üçüncü tarafa 201 + boş gövde döner), gizli ve güvenilmezdirler.

**Hız limiti** (belgelenmemiş, "dinamik"; canlı ölçüm)
- 429 yanıtı nginx HTML gövdesiyle gelir. **Retry-After başlığı taşımaz**; RateLimit-* başlığı da yoktur. Tek IP'den sürdürülebilir hız, 5–10 sn'de bir istek mertebesindedir ve değişkendir.
- Hız kontrolü (AIMD):
  - Başlangıç `ADSBLOL_RPS=0.2`. Alt sınır 0,05, üst sınır 0,5.
  - 429 ya da 420 gelince hız yarıya iner ve tam jitter'lı üstel bekleme uygulanır (15 → 30 → 60 … en fazla 300 sn). `Retry-After` yalnızca varsa kullanılır.
  - Temiz geçen her 5 dk'da hız %10 artar.
  - 5xx'te jitter'lı geri çekilme ve devre kesici devreye girer.
  - **401/403 kısıtlama sayılmaz, politika ya da yapılandırma hatası sayılır.** Devre açılır, döngüde yeniden denenmez, ADMIN_EMAIL'e uyarı gider → RUNBOOK "kaynak anahtar istemeye başladı".
- Hata gövdesi HTML ya da düz metin olabilir. JSON ayrıştırmadan önce durum kodu kontrol edilir.

**Kapsama planı** (istasyon başına ayrı çember yerine birleşik çember)
- Tek bir 250 NM çember (merkez 39,5K 29,5D) beş tohum istasyonun 60 NM çemberlerinin tamamını kapsar; en uzak nokta AYT'de 167,8 + 60 = 227,8 NM'dir.
- Planlayıcı, etkin istasyon çemberlerini kapsayan en az sayıda ≤ 250 NM çember hesaplar. Birincil istasyon (IST) için ek bir küçük çember (≈ 40 NM) dönüşümlü çekilir.
- Tazelik hedefleri: birincil istasyon p95 ≤ 10 sn, diğer istasyonlar ≤ 20 sn, Doğu Türkiye çemberi (≈ 39,2K 38,8D) ≤ 60 sn. Gerçekleşen tazelik ölçülür, `provider_health`'e yazılır ve arayüzde gösterilir.
- Takip listesi (P1) önce kapsama çemberlerinden karşılanır. Kapsama dışındakiler 30 sn'de bir toplu `/v2/hex/...` ile çekilir. İzleyici bölgeleri (P3) varsayılan **kapalıdır**; kapsama dışı alan haritada açıkça belirtilir.
- Bütçe yetmezse önce P3, sonra Doğu çemberi, sonra diğer istasyonların tazeliği düşer. Birincil istasyon ve P1 en son etkilenir.

**Yanıt biçimi** (readsb `jv2` / ADSBx v2 uyumlu)
- Zarf: `{ ac: [], msg, now, total, ctime, ptime }`. **`now` epoch milisaniyedir (tamsayı).**
- `seen_pos` ve `seen` **saniyedir** (ondalıklı). Bu yüzden `sampleTime_ms = now − round(seen_pos × 1000)`.
- readsb `aircraft.json` (yerel alıcı) içinde ise `now` **saniyedir** (ondalıklı): `sampleTime_ms = round((now − seen_pos) × 1000)`. Birim kontrolü yine de yapılır: `now > 1e12` ise ms'dir.
- Alan kuralları:
  - Veri yoksa anahtar hiç gelmez; zod şemasında her alan opsiyoneldir.
  - `flight` 8 karaktere boşlukla doldurulur. Kırpılır; boş kalırsa `null` olur.
  - `alt_baro` `"ground"` olabilir. Bu durumda `onGround=true`, `altBaroFt=null` olur.
  - Yerdeki uçakta `gs` ve `true_heading` bazen gelmez.
  - `hex` `~` ile başlıyorsa ICAO dışı bir adrestir (TIS-B).
  - lat/lon 60 sn'den eskiyse gelmez; yerine `lastPosition {lat, lon, nic, rc, seen_pos}` gelir. Bu yalnızca bayat uçağı göstermek için kullanılır, **olay tespitinde kullanılmaz**.
  - `rr_lat`/`rr_lon` atılır.
  - `type` konum kaynağını söyler (`adsb_icao`, `adsb_icao_nt`, `mlat`, `tisb_*`, `adsr_*`, `adsc`, `mode_s`, `other`). Olay tespitinde `mlat`, `tisb_*` ve `other` düşük ağırlık alır.
  - `squawk` string'dir.
  - `dbFlags` yoksa 0'dır; bitler: 1 askeri, 2 ilginç, 4 PIA, 8 LADD. Değerler bit testiyle okunur (ör. 3 = askeri + ilginç).
- Ek alanlar (Uzman görünüm ve olay motoru için): `ias`, `tas`, `mach`, `wd`, `ws`, `oat`, `tat`, `nav_qnh` (hPa), `nav_altitude_mcp`, `nav_modes` (ör. `approach`), `baro_rate`, `geom_rate`, `track`, `true_heading`, `category`, `emergency`.

## 2. Kendi alıcı (opsiyonel, şu an yok)
- `LOCAL_RECEIVER_URLS`: virgülle ayrılmış readsb/tar1090 `aircraft.json` adresleri, opsiyonel token ile. Tanımlı değilse adaptör kapalıdır.
- Aynı hex için en yeni `sampleTime` kazanır. Yerel veri daha tazeyse yerel veri tercih edilir.
- Bir alıcı adsb.lol'e veri besler ve ileride API anahtarı sağlar. Ayrıca alçak irtifa kapsamasıyla kesin teker koyma tespitini mümkün kılar. Kurulum rehberi ACTIVATION'da "önerilen, opsiyonel" olarak yer alır.

## 3. OurAirports — havalimanı ve pist
- URL'ler: `https://davidmegginson.github.io/ourairports-data/airports.csv` ve `.../runways.csv`. Her gece yenilenir. Lisans kamu malıdır (Unlicense).
- Günlük çekim `If-Modified-Since` ya da ETag ile yapılır. Değişmeyen satır yeniden yazılmaz, hatalı satır atlanır ve loglanır.
- Filtre: `type IN (large_airport, medium_airport)` ya da `scheduled_service = yes`. Anahtar sırası: `icao_code` → `gps_code` → `ident`. `closed = 1` olan pistler atlanır.
- Eşik hesabı domain.md'de tanımlıdır. Türkiye'de (LT*) 118 pistin 105'inde uç koordinatı vardır. Eksik olanlar ARP'a düşer.
- Alan yüksekliği `le_elevation_ft`'ten, yoksa `elevation_ft`'ten alınır. Admin için pist düzeltme tablosu vardır.

## 4. VRS standing-data — havayolu ve rota (CC0)
- Kaynak: `github.com/vradarserver/standing-data`. Ayna: `https://vrs-standing-data.adsb.lol/routes.csv.gz` ve `airports.csv.gz` (CORS açık, ~4,5 MB).
- `airlines/schema-01/airlines.csv`: Code, Name, ICAO, IATA, PositioningFlightPattern, CharterFlightPattern. Güncel veri, AJet (TKJ/VF) dahil.
- `routes/schema-01`: Callsign, Code, Number, AirlineCode, AirportCodes. AirportCodes tireyle ayrılmış ICAO listesidir ve ara durak içerebilir.
- Günlük içe aktarım ETag ile yapılır. Rota uygunluğu (plausibility) yerelde hesaplanır: konum, her bacağın büyük daire hattına en fazla max(50 NM, bacak uzunluğunun %20'si) uzaklıkta olmalıdır. Uymayan rota düşük güvenli sayılır. Sonuç her yerde "tahmini" olarak gösterilir.
- IATA kodları tekil değildir. TK1985 → THY1985 dönüşümünde **şu an uçan** havayolunun ICAO kodu tercih edilir. Belirsizlik admin düzeltme tablosuyla ya da canlı çağrı kodu kanıtıyla çözülür.
- Telsiz çağrı adı (TURKISH, SUNTURK, ANATOLIA) opsiyoneldir. Kaynak FAA JO 7340.2 Bölüm 3'tür (ABD kamu malı, HTML tablo). Wikidata (CC0; P230/P229/P432) yalnızca P580/P582 tarih niteleyicileriyle filtrelenerek yardımcı kaynak olarak kullanılır.
- **OpenFlights kullanılmaz.** 2017'den beri güncellenmiyor (AJet yok) ve ODbL share-alike yükü getiriyor.
- CC0 atıf gerektirmez; yine de ATTRIBUTION.md'de nezaketen anılır.

## 5. aviationweather.gov — METAR/TAF
- Base URL: `https://aviationweather.gov/api/data`.
  - METAR: `GET /metar?ids=LTFM,LTFJ,...&format=json` (`taf=true` ile TAF da aynı yanıtta gelir).
  - TAF: `GET /taf?ids=...&format=json`.
  - Bölge sorgusu: `bbox=lat0,lon0,lat1,lon1`.
- **Tüm istasyonlar tek istekte** çekilir; yanıt başına en fazla 400 kayıt gelir.
- Sınır: dakikada 100 istek. Özel User-Agent kullanılır, `Cache-Control max-age=60`'a uyulur.
- METAR JSON alanları: `icaoId`, `obsTime` (epoch sn), `wdir`, `wspd`, `visib` (ör. "6+"), `altim` (**her zaman hPa**, dönüşüm gerekmez), `clouds[{cover, base}]`, `fltCat`, `rawOb`.
  - Tavan: en alçak BKN/OVC/OVX tabanı; OVX dikey görüş anlamına gelir.
- TAF JSON alanları: `rawTAF`, `issueTime`, `validTimeFrom/To`, `fcsts[]`.
- Eylül 2025'te `/cgi-bin/` yolları ve `recent`, `order`, `vfr`, `output`, `filter`, `fields` parametreleri kaldırıldı. Bunlar kullanılmaz.
- SLA yoktur. Son geçerli METAR önbellekte tutulur ve yaşı arayüzde gösterilir.

## 6. Harita — OpenFreeMap
- Anahtar yok, ticari kullanım serbest, sayı limiti yok, **SLA yok**.
- Stiller: açık `https://tiles.openfreemap.org/styles/liberty`, koyu `.../styles/dark` (alternatif `fiord`). Env: `MAP_STYLE_URL`, `MAP_STYLE_URL_DARK`, `MAP_STYLE_FALLBACK_URL`.
- Zorunlu atıf: "© OpenMapTiles Data from OpenStreetMap". "OpenFreeMap" ibaresi tavsiye edilir.
- Karoların toplu indirilmesi ya da çevrimdışı önbelleğe alınması yasaktır.
- Stil 3 kez yüklenemezse yedek stile geçilir. O da yüklenemezse uçaklar sade bir arka planda çizilir ve "Harita altlığı yüklenemedi" şeridi çıkar.
- Self-host seçeneği (RUNBOOK): Protomaps PMTiles bölgesel kesit.
  - Tüm dünya dosyası ~120 GB'tır ve KVM 2 diskine sığmaz.
  - Kod BSD, karolar ODbL (OSM atfı zorunlu).
- MapTiler Free ticari kullanıma kapalıdır.

## 7. Ticari seçenekler (v1'de yok; Parça 5 için)
| Sağlayıcı | Ne verir | Giriş fiyatı (2026-09) | Kritik şart |
|---|---|---|---|
| AeroDataBox | tarife, FIDS, kapı, durum | ~19 $/ay (direct) | B2C uygulamada gösterim izinli; ham veriyi üçüncü tarafa açmak yasak |
| AirLabs | tarife/pano (kapı, rötar), webhook (beta) | 49–99 $/ay | "As is" yeniden satış yasak; yazılı onay alınmalı |
| Aviationstack | tarife, kapı, rötar | 49,99–149,99 $/ay | ücretli planlarda ticari kullanım; B2C gösterim için yazılı onay alınmalı |
| FlightAware AeroAPI Standard | tarife, kapı, rötar, `on`/`in` webhook alarmı | en az 100 $/ay | **adsb.lol verisiyle birlikte kullanmak FlightAware'in yazılı iznini gerektirir** (md. 10); ham veri ≤ 30 gün |
| Flightradar24 API | konum, özet | 9 / 90 / 900 $/ay | **kullanılamaz:** rakip ürün geliştirmek ve başka kaynağı tamamlamak yasak (ToS 6.3.1) |
| Cirium / OAG / ADSBx Enterprise | kurumsal | teklifle | sözleşme gerekir |

Her ticari sağlayıcı lisans kaydında şu ek alanları taşır: `mixingWithOtherRealtimeAllowed`, `maxRawStorageDays`, `b2cDisplayAllowed`.
