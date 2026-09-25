# Veri kaynakları — doğrulanmış ayrıntılar

Doğrulama tarihi: **2026-09-25**. Canlı istekler ve kaynak kodu/doküman okumasıyla doğrulandı; ham notlar `docs/research/` altındadır. Buradaki bir bilgi gerçekle çelişirse DUR-SOR: önce yeniden doğrula, sonra bu dosyayı güncelle.

## Lisans kaydı
`packages/providers` içindeki her sağlayıcı şu 7 alanı taşır:
- `commercialUse`
- `attribution`
- `shareAlike`
- `rateLimit`
- `b2cDisplayAllowed`
- `mixingWithOtherRealtimeAllowed`
- `maxRawStorageDays`

`DATA_USAGE_MODE=commercial` iken `commercialUse:false` olan bir sağlayıcı başlatılamaz.

## 1. adsb.lol — tek canlı kaynak

**Erişim ve şartlar**
- **Anahtar:** Şu an anahtarsızdır. Şartlarda şu yazar: "In the future, you will require an API key which you can get by feeding to adsb.lol". Opsiyonel `ADSBLOL_API_KEY` ve `ADSBLOL_API_KEY_HEADER` env'leri şimdiden desteklenir.
- **İletişim:** Şartlar, üretimde kullanmadan önce işletmeciyle iletişime geçilmesini istiyor ("please contact me so I do not break your application"). Adres: info@adsb.lol. Bu, üretim ingest'inden (Parça 1 M4 yayını) önce yapılacak bir ACTIVATION adımıdır.
- **User-Agent zorunludur.** Boş UA ve Node'un varsayılan `node` UA'sı HTTP 403 ("User-Agent too generic") alır.
  - Biçim: `<APP_NAME|ucus-takip>/<sürüm> (+https://<WEB_HOST>; <CONTACT_EMAIL>)`.
  - `WEB_HOST` boşsa: `<APP_NAME|ucus-takip>/<sürüm> (+mailto:<CONTACT_EMAIL>)`.
  - `CONTACT_EMAIL` boşsa ingest başlamaz.
- **CORS yoktur:** Tarayıcı ve mobil istemci doğrudan çağıramaz; yalnızca worker çağırır. Sunucusuz çıkışların (Cloudflare Workers) ilk istekte 429 aldığı raporlandı (işletmeci doğrulamadı); kullanılmaz.
- **SLA yoktur** ("as is"). Durum sayfası: https://status.adsb.lol

**Lisans: ODbL 1.0** (ticari kullanıma izin verir)
- **Atıf** harita, uçuş sayfası, mobil "Veri kaynakları" ekranı ve ATTRIBUTION.md'de yer alır: "Canlı uçuş verisi: [ADSB.lol](https://adsb.lol) — [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)". Bağlantılar zorunludur.
- **Türetilmiş veritabanı:** Saklanan konum ve iz tabloları *Derivative Database*'tir. Herkese açık kullanıldıkları için ODbL altında kalırlar. v1'de `/acik-veri` sayfası, md. 4.6(b) uyarınca türetme yöntemini anlatan makine okunur belgeyi ücretsiz sunar: filtreler, örnekleme, saklama, olay kuralları. Günlük döküm v1'de yoktur.
- **Ayrı tutulan veri:** Kullanıcı, takip ve fatura tabloları ayrı şemadadır ve hiçbir dökümde yer almaz (*Collective Database*, md. 4.5a).
- **Kullanım koşulları:** Koşullarımız ADS-B türevi verinin yeniden kullanımını yasaklayamaz (md. 4.7). Ücret veriye değil özelliklere alınır.

**Uç noktalar** (şema: `https://api.adsb.lol/api/openapi.json`; `/docs` JS ile oluşur, okunamaz)
- `GET /v2/point/{lat}/{lon}/{radius}`: radius **NM** cinsinden, tamsayı, en fazla **250**. Yanıt `dst` (NM) ve `dir` (derece) alanlarını da içerir.
- `GET /v2/hex/{h1,h2,...}`: çoklu değer çalışır. Çağrı başına en fazla 500 hex, URL ≤ 4 KB.
- `GET /v2/callsign/{cs1,cs2}` ve `GET /v2/reg/{reg}` çoklu değer destekler. `/v2/type/{t}` ve `/v2/sqk/{s}` de vardır.
- `/v2/mil`, `/v2/ladd` ve `/v2/pia` tüm dünyayı döndürür; zamanlanmış çekimde kullanılmaz. `/v2/all` kapalıdır (503).
- Değerlerde yalnızca `a-zA-Z0-9,=_.-` karakterlerine izin verilir.
- **Kullanılmaz:**
  - `POST /api/0/routeset`: Referer kontrolü yapar; üçüncü tarafa 201 + boş gövde döner.
  - Gizli `GET /api/0/route/...`: önbellekte olmayan çağrı kodlarında 500 döner ve verilen konumu yok sayar.

**Hız limiti** (belgelenmemiş, "dinamik"; 2026-09-25 ölçümleri)
- **Gözlem:**
  - 429 yanıtı nginx HTML gövdesiyle gelir ve **Retry-After taşımaz**; RateLimit-* başlığı da yoktur.
  - Bir kez gövdesiz 420 görüldü (doğrulanamadı); 420 de 429 gibi ele alınır.
  - 10 sn'de bir istekte bile 429 görüldü. Güvenli varsayım: tek IP'den **10 sn'de bir istek ya da daha yavaş**.
  - VPS'in veri merkezi IP'si ölçülmedi; daha sert sınırlanabilir.
- **Hız kontrolü (AIMD):**
  - Başlangıç `ADSBLOL_RPS=0.1`, alt sınır 0,05, üst sınır 0,2. Üst sınır ancak VPS'ten yapılan 24 saatlik ölçümde 429 oranı %5'in altındaysa ve DECISIONS kaydıyla yükseltilir.
  - 429 ya da 420 gelince hız yarıya iner ve tam jitter'lı üstel bekleme uygulanır (15 → 30 → 60 … en fazla 300 sn). `Retry-After` yalnızca varsa kullanılır.
  - Temiz geçen her 10 dk'da hız %10 artar.
  - 5xx'te jitter'lı geri çekilme ve devre kesici devreye girer.
  - **401/403 kısıtlama değildir; politika ya da yapılandırma hatasıdır.** Devre açılır, döngüde yeniden denenmez, ADMIN_EMAIL'e uyarı gider → RUNBOOK "adsb.lol API anahtarı istemeye başladı (401/403)".
- **Yanıt işleme:** Hata gövdesi HTML ya da düz metin olabilir. JSON ayrıştırmadan önce durum kodu kontrol edilir.

**Sağlayıcı durumu** (WS mesajları, durum şeridi ve kesinti bastırma bu tanımı kullanır)
- `ok`: son 60 sn'de en az bir başarılı yanıt var ve birincil istasyon tazeliği ≤ hedef × 2.
- `degraded`: son 60 sn'de 429/420/5xx oranı > %20 ya da birincil istasyon tazeliği > hedef × 2.
- `down`: 60 sn boyunca başarılı yanıt yok ya da devre açık (401/403 dahil).

Durum geçişleri `provider_health`'e yazılır.

**Kapsama planı ve öncelikler**
- **Öncelik sınıfları:**
  - **P0** istasyon çemberleri: her etkin istasyon için ARP merkezli 60 NM.
  - **P1** takip listesi.
  - **P2** Türkiye taban kapsaması: birleşik batı çemberi (merkez 39,5K 29,5D) ve Doğu Türkiye çemberi (39,2K 38,8D); ikisi de 250 NM.
  - **P3** izleyici bölgeleri: varsayılan **kapalı**. Kapsama dışı alan haritada açıkça belirtilir.
- **Planlayıcı:** P0 çemberlerini kapsayan en az sayıda ≤ 250 NM çemberi hesaplar ve P2 Doğu çemberini her zaman ekler. Tek batı çemberi beş tohum istasyonun P0 çemberlerini kapsar; en uzak nokta AYT'dir (167,8 + 60 = 227,8 NM). Birincil istasyon için ek bir ≈ 40 NM çember dönüşümlü çekilir.
- **Tazelik hedefleri** (tazelik = ölçüm anı − `sampleTime`; adsb.lol yanıt süresi ve `seen_pos` dahil):
  - birincil istasyon p95 ≤ 20 sn
  - diğer istasyonlar ≤ 30 sn
  - Doğu çemberi ≤ 90 sn

  Gerçekleşen tazelik `provider_health`'e yazılır ve arayüzde gösterilir.
- **P1 karşılama:** Takip listesi önce kapsama çemberlerinden karşılanır. Kapsama dışındakiler 30 sn'de bir toplu `/v2/hex/...` ile çekilir. Takip listesindeki her uçak en geç 30 sn'de bir güncellenir.
- **Bütçe yetmezse:** önce P3, sonra Doğu çemberi, sonra diğer istasyonların tazeliği düşer. Birincil istasyon ve P1 en son etkilenir.

**Yanıt biçimi** (readsb `jv2` / ADSBx v2 uyumlu)
- **Zarf:** `{ ac: [], msg, now, total, ctime, ptime }`. **`now` epoch milisaniyedir (tamsayı).**
- **Zaman:** `seen_pos` ve `seen` **saniyedir** (ondalıklı).
  - adsb.lol: `sampleTime_ms = now − round(seen_pos × 1000)`.
  - readsb `aircraft.json` (yerel alıcı; `now` **saniye**, ondalıklı): `sampleTime_ms = round((now − seen_pos) × 1000)`.
  - Birim kontrolü: `now > 1e12` ise ms'dir.
- **Alan kuralları:**
  - Veri yoksa anahtar hiç gelmez; zod şemasında her alan opsiyoneldir.
  - `flight` 8 karaktere boşlukla doldurulur. Kırpılır; boş kalırsa `null` olur.
  - `alt_baro` `"ground"` olabilir. O zaman `onGround=true`, `altBaroFt=null` olur. Yerdeki uçakta `gs` ve `true_heading` bazen gelmez.
  - `hex` `~` ile başlıyorsa ICAO dışı bir adrestir (TIS-B).
  - lat/lon 60 sn'den eskiyse gelmez; yerine `lastPosition {lat, lon, nic, rc, seen_pos}` gelir. Bu yalnızca bayat uçağı göstermek içindir, **olay tespitinde kullanılmaz**. `rr_lat`/`rr_lon` atılır.
  - `type` konum kaynağını söyler: `adsb_icao`, `adsb_icao_nt`, `mlat`, `tisb_*`, `adsr_*`, `adsc`, `mode_s`, `other`.
  - `squawk` string'dir.
  - `dbFlags` yoksa 0'dır; bitler 1 askeri, 2 ilginç, 4 PIA, 8 LADD (ör. 3 = askeri + ilginç). Bit testiyle okunur.
- **Ek alanlar** (Uzman görünüm ve motor için): `ias`, `tas`, `mach`, `wd`, `ws`, `oat`, `tat`, `nav_qnh` (hPa), `nav_altitude_mcp`, `nav_modes` (ör. `approach`), `baro_rate`, `geom_rate`, `track`, `true_heading`, `category`, `emergency`.

## 2. Kendi alıcı (opsiyonel; kullanıcı şu an kurmuyor, D-006)
- `LOCAL_RECEIVER_URLS`: virgülle ayrılmış readsb/tar1090 `aircraft.json` adresleri, opsiyonel token ile. Tanımlı değilse adaptör kapalıdır. Geliştirmede replay alıcısı bu yoldan bağlanır.
- **Birleştirme:** Aynı hex için en yeni `sampleTime` kazanır; yerel veri daha tazeyse yerel veri tercih edilir.
- **Faydası:** Alıcı adsb.lol'e veri beslerse ileride API anahtarı sağlar. Alçak irtifa kapsamasıyla kesin teker koyma tespitini de mümkün kılar.

## 3. OurAirports — havalimanı ve pist
- **Kaynak:** `https://davidmegginson.github.io/ourairports-data/airports.csv` ve `.../runways.csv`. Her gece yenilenir. Lisans kamu malıdır (Unlicense).
- **İçe aktarım:** Günlük, `If-Modified-Since` ya da ETag ile. Değişmeyen satır yeniden yazılmaz, hatalı satır atlanır ve loglanır. Testte ve `EXTERNAL_PROVIDERS_DISABLED` iken `tools/fixtures/ourairports/` altındaki commit'li alt küme kullanılır (Türkiye + birkaç büyük havalimanı).
- **Filtre:** `type IN (large_airport, medium_airport)` ya da `scheduled_service = yes`. Anahtar sırası `icao_code` → `gps_code` → `ident`. `closed = 1` olan pistler atlanır.
- **Eşik ve yükseklik:** Eşik hesabı domain.md'de tanımlıdır. Türkiye'de (LT*) 118 pistin 105'inde uç koordinatı vardır. Alan yüksekliği `le_elevation_ft`'ten, yoksa `elevation_ft`'ten alınır. Admin için pist düzeltme tablosu vardır.

## 4. VRS standing-data — havayolu ve rota (CC0)
- **Kaynaklar:**
  - Havayolları: `github.com/vradarserver/standing-data` → `airlines/schema-01/airlines.csv` (raw, ETag). Aynada yoktur.
  - Rotalar ve havalimanları: `https://vrs-standing-data.adsb.lol/routes.csv.gz` (~4,5 MB) ve `airports.csv.gz` (~1 MB), CORS açık.
- **Şemalar:**
  - `airlines.csv`: Code, Name, ICAO, IATA, PositioningFlightPattern, CharterFlightPattern. AJet (TKJ/VF) dahil güncel.
  - `routes/schema-01`: Callsign, Code, Number, AirlineCode, AirportCodes. AirportCodes tireyle ayrılmış ICAO listesidir ve ara durak içerebilir.
- **İçe aktarım:** Havayolları Parça 1 M2'de (sefer no araması için), rotalar Parça 2'de gelir. İkisi de günlük, ETag ile.
- **Rota uygunluğu:** yerelde hesaplanır. Konum, her bacağın büyük daire hattına en fazla max(50 NM, bacak uzunluğunun %20'si) uzaklıkta olmalıdır. Uymayan rota düşük güvenli sayılır. Sonuç her yerde "tahmini" gösterilir.
- **IATA kodları tekil değildir.** TK1985 → THY1985 dönüşümünde **şu an uçan** havayolunun ICAO kodu tercih edilir. Belirsizlik admin düzeltme tablosuyla ya da canlı çağrı kodu kanıtıyla çözülür.
- **Kapsam dışı ve atıf:** Telsiz çağrı adları (TURKISH, SUNTURK) v1'de yoktur. **OpenFlights kullanılmaz:** 2017'den beri güncellenmiyor ve ODbL share-alike yükü getiriyor. CC0 atıf gerektirmez; yine de ATTRIBUTION.md'de nezaketen anılır.

## 5. aviationweather.gov — METAR/TAF
- **Base URL:** `https://aviationweather.gov/api/data`. Uç noktalar:
  - METAR: `GET /metar?ids=LTFM,LTFJ,...&format=json` (`taf=true` ile TAF da aynı yanıtta gelir)
  - TAF: `GET /taf?ids=...&format=json`
  - bölge sorgusu: `bbox=lat0,lon0,lat1,lon1`
- **İstek düzeni:** Tüm istasyonlar tek istekte çekilir; yanıt başına en fazla 400 kayıt gelir. Sınır dakikada 100 istektir. Özel User-Agent gönderilir, `Cache-Control max-age=60`'a uyulur.
- **METAR JSON alanları:** `icaoId`, `obsTime` (epoch sn), `wdir`, `wspd`, `visib` (ör. "6+"), `altim` (**her zaman hPa**), `clouds[{cover, base}]`, `fltCat`, `rawOb`. Tavan = en alçak BKN/OVC/OVX tabanı (OVX dikey görüş anlamına gelir).
- **TAF JSON alanları:** `rawTAF`, `issueTime`, `validTimeFrom/To`, `fcsts[]`.
- **Kaldırılanlar:** Eylül 2025'te `/cgi-bin/` yolları ve `recent`, `order`, `vfr`, `output`, `filter`, `fields` parametreleri kaldırıldı; kullanılmaz.
- **SLA yoktur.** Son geçerli METAR önbellekte tutulur ve yaşı gösterilir. Testte `tools/fixtures/metar/` kullanılır.

## 6. Harita — OpenFreeMap
- **Şartlar:** Anahtar yok, ticari kullanım serbest, sayı limiti yok, **SLA yok**.
- **Stiller:** açık `https://tiles.openfreemap.org/styles/liberty`, koyu `.../styles/dark` (alternatif `fiord`). Env: `MAP_STYLE_URL`, `MAP_STYLE_URL_DARK`, `MAP_STYLE_FALLBACK_URL`. Testte yerel `test-style.json` kullanılır.
- **Atıf:** Zorunlu metin "© OpenMapTiles Data from OpenStreetMap"; "OpenFreeMap" ibaresi tavsiye edilir.
- **Önbellek yasağı:** Karo, stil, glif ve sprite'ların toplu indirilmesi ve service worker'da önbelleğe alınması yasaktır.
- **Hata durumu:** Stil 3 kez yüklenemezse yedek stile geçilir. O da yüklenemezse uçaklar sade bir arka planda çizilir ve "Harita altlığı yüklenemedi" şeridi çıkar.
- **Self-host yedeği (RUNBOOK):** Protomaps PMTiles bölgesel kesit. Tüm dünya dosyası ~120 GB'tır ve KVM 2 diskine sığmaz. Kod BSD, karolar ODbL (OSM atfı zorunlu).
- MapTiler Free ticari kullanıma kapalıdır.

## 7. Ticari seçenekler (v1'de yok; Parça 5 için)
| Sağlayıcı | Ne verir | Giriş fiyatı (2026-09) | Kritik şart |
|---|---|---|---|
| AeroDataBox | tarife, FIDS, kapı, durum | ~19 $/ay (direct) | B2C uygulamada gösterim izinli; ham veriyi üçüncü tarafa açmak yasak |
| AirLabs | tarife/pano (kapı, rötar), webhook (beta) | 49–99 $/ay | "As is" yeniden satış yasak; yazılı onay alınmalı |
| Aviationstack | tarife, kapı, rötar | 49,99–149,99 $/ay | ücretli planlarda ticari kullanım; B2C gösterim için yazılı onay |
| FlightAware AeroAPI Standard | tarife, kapı, rötar, `on`/`in` webhook alarmı | en az 100 $/ay | adsb.lol verisiyle birlikte kullanım FlightAware'in **yazılı iznini** gerektirir (md. 10); ham veri ≤ 30 gün; "commercial aircraft situational displays" kullanımı yasak (md. 8) |
| Flightradar24 API | konum, özet (tarife yok) | 9 / 90 / 900 $/ay | **kullanılamaz:** rakip ürün ve başka kaynağı tamamlama yasak (ToS 6.3.1) |
| Cirium (FlightStats) | tarife ve durum; havalimanı panosu/FIDS/alarm yalnızca sözleşmeli Premium'da | Commercial plan kredi kartıyla, kullandıkça öde (standart API'ler) | Track/Flights Near API'leri "Powered by FlightRadar24" |
| OAG | tarife (15 dk'da bir), durum, kapı; Flight Info Alerts; konum yok | ücretsiz keşif katmanı (aylık sınırlı); ücretli katmanlar teklifle | abonelik şartları incelenmeli |
| ADSBx Enterprise | yalnızca konum/operasyon; tarife yok | teklifle, yıllık asgari taahhüt | Community API (10 $) ticari kullanıma kapalı |
