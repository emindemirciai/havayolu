# Alan tanımları, eşikler ve birimler

Olay motoru, bildirimler ve arayüz bu dosyadaki tanımlara uyar. Buradaki bir tanımı değiştirmek DUR-SOR gerektirir.

## Birimler ve zaman
- İrtifa ft, hız kt, dikey hız ft/dk, mesafe km (ayarlardan NM seçilebilir). 1 NM = 1,852 km; 10 km ≈ 5,4 NM.
- DB'de tüm zamanlar UTC'dir (`timestamptz`). Arayüzde yerel saat (Europe/Istanbul) ya da UTC ("Z" ekiyle) seçilebilir.
- Olay zamanları her zaman örneğin `sampleTime` değerinden alınır, sunucu saatinden alınmaz.

## Temel kavramlar
- **İstasyon:** Takip edilen havalimanı. Varsayılan tohumlar IST (LTFM), SAW (LTFJ), ESB (LTAC), ADB (LTBJ), AYT (LTAI). Birincil istasyon IST'dir.
- **ARP:** Havalimanı referans noktası (OurAirports `latitude_deg/longitude_deg`).
- **Pist eşiği:** OurAirports `le_/he_` koordinatı, `displaced_threshold_ft × 0,3048` m kadar pist yönünde kaydırılır. Koordinat yoksa ARP'a düşülür, toleranslar genişler ve bu durum olay verisine `thresholdSource: 'arp_fallback'` olarak yazılır.
- **Uçuş örneği (flight instance):** Aynı hex'in kesintisiz bir uçuşu. Şu durumlardan biri yeni örnek başlatır: 30 dk veri boşluğu, çağrı kodu değişimi, yerde 20 dk bekleme.
- **Alan üstü yükseklik (AGL):** Hesaplama yöntemi için bkz. Parça 2 prompt'u. Kullanılan yöntem (`qnh | geoid | baro_tolerant`) olay verisine yazılır.

## Yaklaşma olayı
- Hazır mesafe eşikleri: 50 / 30 / 20 / 10 / 5 km. Hazır süre eşikleri: inişe 15 / 10 / 5 / 3 dk. Varsayılan: **10 km**.
- **Mesafe referansı:** Varsayılan olarak **ARP'a** yatay mesafe kullanılır. Uzman ayarında "hizalı pist eşiğine" seçilebilir. Bildirim metni referansı açıkça yazar: "IST'ye 10 km" ya da "34L eşiğine 10 km".
- Her eşik, aynı yaklaşma denemesi içinde bir kez tetiklenir. Pas geçmeden sonraki yeni deneme eşikleri yeniden üretebilir.

## Durum makinesi (kod değerleri İngilizce)
| Kod | TR etiket (i18n) |
|---|---|
| `EN_ROUTE` | Seyirde |
| `APPROACHING` | Yaklaşmada |
| `TOUCHED_DOWN` | Teker koydu |
| `ON_GROUND` | Yerde |
| `GO_AROUND` | Pas geçti |
| `LOW_ALT_LOST` | Alçakta sinyal kaybı |
| `PROBABLE_LANDING` | Muhtemelen indi |

Geçişler:
- `EN_ROUTE → APPROACHING → TOUCHED_DOWN → ON_GROUND`
- `APPROACHING → GO_AROUND → APPROACHING` (yeni deneme, `attempt_no + 1`)
- `APPROACHING → LOW_ALT_LOST → PROBABLE_LANDING`. Uçak sonra yerde görülürse → `TOUCHED_DOWN` (doğrulama).

## Olaylar
- `approach_threshold` — eşik başına bir kez tetiklenir.
- `touchdown` — havada → yerde geçişi gözlenir. Kesin iniştir.
- `probable_landing` — alçakta sinyal kaybından yapılan çıkarımdır. Güven düzeyi (`high | medium`) ve tahmini iniş saati taşır.
- `go_around` — yaklaşmadan sonra inmeden tırmanış.
- `takeoff` — istasyonda yerde → havada geçişi.
- İdempotensi anahtarı: `(flight_instance_id, station_id, event_type, threshold_key, attempt_no)`.

## İniş tespiti ve kapsama gerçeği
adsb.lol kitle kaynaklıdır. 2026-09-25 anlık ölçümünde IST çevresindeki 60 NM içinde **yerde hiçbir uçak görünmedi**. Kullanıcının kendi alıcısı yoktur. Bu yüzden:
- Birçok iniş `probable_landing` olarak bildirilir. Bu bir yan yol değil, **birinci sınıf bir yoldur**.
- Metin dürüst olur: "TK1985 IST'ye muhtemelen indi — tahmini 14:32 (yüksek güven)". Kesin tespitte ise: "TK1985 IST'de teker koydu — 14:32, pist 34L".
- `high` güven: son örnek AGL ≤ 300 ft, hizalı pist eşiğine ≤ 3 km, alçalıyor. Sonra ≥ 60 sn veri yok.
- `medium` güven: son örnek AGL < 1.000 ft, ARP'a ≤ 8 km, alçalıyor. Sonra ≥ 90 sn veri yok.
- Tahmini iniş saati = son örnek zamanı + (eşiğe kalan mesafe ÷ yer hızı).
- **Kesinti bastırma:** Sağlayıcı `degraded` ya da `down` iken, bölgesel tazelik hedefin 2 katını aştığında ve worker açılışından sonraki ilk 120 sn içinde `LOW_ALT_LOST → PROBABLE_LANDING` geçişi askıya alınır. Kaynak dönünce uçak yerde görülürse normal `touchdown` akışı çalışır. Görülmezse olay yalnızca uygulama içine "veri kesintisi nedeniyle doğrulanamadı" olarak yazılır ve push gönderilmez.
- İstasyon başına **kapsama kalitesi** ölçülür ve istasyon sayfasında gösterilir: son 7 günde yerde örneği görülen varışların oranı. Oran %70'in altındaysa o istasyonda iniş varsayılan olarak "muhtemel" sunulur.

## Takip türleri ve eşleşme kuralları
- **Uçak:** tescil ya da hex ile. Süreklidir.
- **Uçuş:** sefer no (TK1985) ya da çağrı kodu (THY1985) ile, belirli bir gün ya da "bir sonraki uçuş" için.
  - Aday çağrı kodları: ICAO önek + numara + admin düzeltme tablosu.
  - Takip `pending` olarak kaydedilir. Aday çağrı kodu canlı görülünce ya da kullanıcı canlı adaylardan seçince bir uçuş örneğine bağlanır (`matched`).
  - "Gün", Europe/Istanbul takvim günüdür. O gün içinde ilk görülen eşleşme bağlanır. "Bir sonraki uçuş", takip oluşturulduktan sonraki ilk eşleşmedir.
  - İnişten 30 dk sonra takip kapanır (`completed`). Gün sonuna kadar eşleşme olmazsa `expired` olur. Kullanıcıya uygulama içi bildirim gider ve tescil ile takip önerilir.
  - Harfli çağrı kodu kullanan havayollarında (ör. THY4KN, THY1KQ) sefer no eşleşmesi garanti değildir. Takip kurulurken bu uyarı baştan gösterilir. Havayolu tablosunda `usesAlphanumericCallsigns` bayrağı bulunur.
- **İstasyon akışı:** Bir istasyona gelen trafik; filtreler havayolu, tip ve çağrı kodu önekidir.
  - Filtreli akışta her olaya push gider. Olay türleri kullanıcı tarafından seçilir.
  - Filtresiz akışta push yoktur. Yalnızca uygulama içi akış ve operasyon panosu çalışır; kullanıcıya bu açıkça söylenir.

## Bildirim sınırları
- Kullanıcı başına saatlik push sınırı config'ten gelir. Kullanıcı ayarıyla ve admin tarafından yükseltilebilir.
- Sınır aşılırsa fazla bildirimler uygulama içine yazılır ve özet push gönderilir.
- **İstisna:** Açıkça takip edilen uçuş ya da uçağın `touchdown` ve `probable_landing` bildirimleri hiçbir zaman özete çevrilmez.
- Sessiz saatlerde push gönderilmez, uygulama içi kayıt tutulur. Kullanıcı "takip ettiğim uçuşun inişi sessiz saatte de gelsin" seçeneğini açabilir.

## v1 sınırları (kullanıcıya açıkça söylenir)
ADS-B yalnızca konum, irtifa, hız ve kimlik verir. Tarife verisi olmadığından v1'de şunlar **yoktur**:
- tarifeli/tahmini kalkış ve varış saati (STD/STA/ETD)
- rötar dakikası, kapı/terminal/bagaj bilgisi, kod paylaşımı, iptaller
- kalkış öncesi kalkış panosu
- harfli çağrı kodlu seferlerde kalkıştan önce sefer no ile arama

ETA yalnızca havadaki uçak için konumdan hesaplanır ve "tahmini" etiketi taşır. Rota tahmini (VRS standing-data) de her yerde "tahmini" olarak gösterilir.

## Saklama
- İz: `track_points_sampled` 30 sn örnekleme, 7 gün. `track_points_fine` tam çözünürlük, 30 gün. Yalnızca varış/kalkış olarak sınıflanmış, ARP'a ≤ 30 km ve AGL < 10.000 ft olan uçaklar ile takip listesindekiler yazılır.
- `flights` ve `events` özetleri en az 365 gün tutulur. İz verisi süresi dolan bir uçuş sayfası olay zaman çizelgesini göstermeye devam eder ve "iz verisi saklama süresini aştı" der.
