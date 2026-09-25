# Parça 3 — Web ürününün tamamı

**Başlatma:** `@docs/prompts/parca-3.md dosyasındaki Parça 3'e başla`
**Önce oku:** Parça 1–2 raporları, `docs/spec/domain.md` ("v1 sınırları", takip ve bildirim kuralları). `.claude/rules/web-ui.md` `apps/web` altında otomatik yüklenir.

## Hedef
Bu parça bittiğinde web tarafı herkese açık bir ürün olarak eksiksiz çalışır:
- kayıt, takip, bildirimler
- canlı harita, uçuş sayfası ve geçmiş oynatma
- istasyon sayfası ve **tam ekran operasyon panosu**
- admin paneli, yasal sayfalar ve açık veri sayfası
- CSP ve güvenlik başlıkları

## M1 — Tasarım sistemi (`p3/m1-design`) — önce plan, sonra DUR
**`docs/DESIGN.md` içeriği:**
- 4–6 renklik, adlandırılmış palet (açık ve koyu tema; WCAG AA kontrastı hesaplanmış)
- tipografi rolleri, yerleşim ilkesi, bileşen token'ları

Token'lar `packages/shared/design-tokens` içinde platformdan bağımsız JSON olarak tutulur; mobil de aynı token'ları kullanacaktır.

Kodlamaya başlamadan önce planı şu soruyla gözden geçir: "Bu, benzer her projede de çıkacak varsayılan bir çözüm mü?" Varsayılan kalan kısımları değiştir ve nedenini yaz.

**Görsel dil konunun kendisinden gelsin:**
- seyrüsefer haritası renkleri ve yaklaşma çemberleri
- meydan levhalarının sarı-siyahı (durum etiketlerinde ölçülü)
- koyu temada kokpit navigasyon ekranının renk anlamları

**Kaçınılacak kalıplar:**
- krem zemin + kiremit vurgu
- siyah zemin + tek asit yeşili vurgu
- her şeyi aynı yuvarlak kartlara bölen SaaS görünümü
- başlıkların üstüne BÜYÜK HARF etiketler
- dekoratif gradyanlar

**Tipografi** (doğrulandı 2026-09-25):
- B612 Türkçe glifleri (ğ Ğ ş Ş ı İ) **içermez**, kullanılmaz.
- Arayüz: **Overpass** (Highway Gothic esinli levha karakteri, OFL; `font-variant-numeric: tabular-nums` ile tnum). Alternatif: Atkinson Hyperlegible Next.
- Veri (saat, irtifa, hız): **IBM Plex Mono** ya da **Atkinson Hyperlegible Mono** (Türkçe tam, OFL).
- Fontlar self-host edilir (`next/font` ya da `@fontsource`), `latin-ext` alt kümesi dahil. `<html lang="tr">` verilir; `locl` ile İ/ı büyük-küçük harf dönüşümü doğru olur.
- `scripts/check-glyphs.mts` fontun cmap'inde `ğĞşŞıİçÇöÖüÜ` karakterlerinin hepsini arar; eksik varsa başarısız olur ve CI'da çalışır.

**Hareket:**
- Cesaret tek yerde harcanır: istasyonun yaklaşma çemberi ve teker koyma anı için tek, kurgulanmış bir animasyon.
- Geri kalanı sakin ve disiplinlidir. `prefers-reduced-motion` ayarına uyulur.

**Erişilebilirlik (WCAG 2.1 AA):**
- yeterli kontrast
- klavyeyle tam kullanım ve görünür odak
- ekran okuyucu etiketleri
- panolarda gerçek tablo yapısı

**DUR:** Kullanıcıya şunlar sunulur: DESIGN.md, token dosyası ve Playwright ile alınmış 3 örnek ekran (ana sayfa, harita, istasyon panosu; açık + koyu). Ekranlar 390×844 ve 1440×900 boyutlarında, `docs/reports/screens/parca-3/` altına kaydedilir. Onay gelmeden sayfa yapımına geçilmez.

## M2 — Arayüz metinleri ve dil yönlendirmesi (`p3/m2-copy`)
- Türkçe, cümle düzeninde ve etken çatıyla yazılır ("Takibe al", "Bildirimi kapat"). Aynı eylem akış boyunca aynı adı taşır.
- Hata mesajları özür dilemez; ne olduğunu ve nasıl düzeltileceğini söyler.
- Boş ekranlar eyleme çağırır. Örnek: "Henüz takip ettiğin uçuş yok. Sefer numarası ya da tescil ile ara."
- Tahmini bilgi her zaman "tahmini" etiketi taşır. Muhtemel iniş, kesin inişten görsel ve metinsel olarak ayrışır.
- Dil yönlendirmesi: TR varsayılan yoldur (`/`), EN `/en/...` altındadır. `hreflang` eklenir; dil anahtarı URL'yi korur.

## M3 — Harita, arama ve uçuş sayfası (`p3/m3-map-flight`)
### Canlı harita (tam ekran)
- **Arama:** sefer no, çağrı kodu, tescil, havalimanı. Harfli çağrı kodlu seferlerde canlı adaylar tescil ve tahmini rotayla gösterilir.
- **Filtreler:** havayolu, tip, irtifa bandı, yerde/havada, kategori.
- **Katmanlar:** etiketler, irtifaya göre renklenen iz, istasyon yaklaşma çemberleri.
- **Seçili uçak paneli:** kimlik bilgileri, tahmini rota, canlı değerler, varışa mesafe ve ETA, olay zaman çizelgesi, son 30 dakikanın irtifa/hız grafiği.
- **"Takibe al" akışı:** eşik seçimi, mesafe referansı (ARP ya da eşik), izlenecek olaylar ve kanallar. Sefer no takibinde eşleşme uyarısı gösterilir (domain.md).

### Sade / Uzman görünüm anahtarı
- **Sade:** durum, ETA, rota.
- **Uzman:** bunlara ek olarak squawk, dikey hız, IAS/TAS/Mach, rüzgâr, OAT, seçili irtifa, `nav_modes`, pist, QNH, AGL yöntemi, veri kaynağı ve konum kaynağı (ADS-B/MLAT), tazelik.

### Uçuş sayfası (paylaşılabilir URL)
- İz, grafikler ve olaylar.
- Geçmiş oynatma: zaman çubuğu ve 1×–60× hız.
- İz verisi saklama süresini aştıysa sayfa zaman çizelgesini ve özeti gösterir ve "iz verisi saklama süresini aştı (N gün)" der.

## M4 — İstasyon sayfası ve operasyon panosu (`p3/m4-station`)
**Varış panosu:**
- Sütunlar: sefer/çağrı kodu, tescil, tip, tahmini kalkış meydanı, mesafe, ETA, durum.
- Durumlar: seyirde / yaklaşmada / teker koydu (saatiyle) / muhtemelen indi (tahmini saat + güven) / pas geçti.
- Panonun altında tek satırlık not: "Canlı konumdan hesaplanır; tarife verisi içermez."

**Diğer bölümler:**
- son 2 saatin inişleri ve **kalkışları** (pist ve saatle)
- çözümlenmiş METAR/TAF (yaşıyla birlikte)
- yaklaşma haritası
- kapsama kalitesi göstergesi (domain.md)
- filtreli istasyon takibi

**Operasyon panosu** (`/istasyon/<icao>/operasyon`) — tam ekran, otomatik yenilenen, istasyon operasyonu için:
- Havayolu ve tip filtreli varış tablosu. Satır başına 10 km ve iniş durumu görünür.
- Büyük tipografi ve yüksek kontrast; uzaktan okunabilir.
- Kiosk modu (imleç ve kenar çubuğu gizli).
- Veri tazeliği ve sağlayıcı durumu köşede sürekli görünür.
- Gerçek tablo yapısıdır; ekran okuyucu uyumludur.

## M5 — Kullanıcı sayfaları ve PWA (`p3/m5-account-pwa`)
- **Kimlik sayfaları:** kayıt, doğrulama, giriş, şifre sıfırlama. `TURNSTILE_*` tanımlıysa kayıtta bot koruması açılır: siteverify yalnızca sunucuda yapılır, token 300 sn geçerli ve tek kullanımlıktır, `idempotency_key` kullanılır.
- **Takip listem ve bildirim merkezi:** eşleşme durumları görünür (bekliyor / eşleşti / süresi doldu).
- **Ayarlar:** dil, birimler, yerel/UTC saat, tema, kanallar, web push izni, sessiz saatler, saatlik push sınırı.
- **Hesap:** e-posta, şifre, verilerimi indir, hesabı sil.
- Parça 2'deki `/kurulum/bildirim` sayfası bu sisteme taşınır ve admin paneline bağlanır.
- **PWA:**
  - Manifest ve özgün ikon seti.
  - Service worker: push gösterimi, bildirime tıklayınca ilgili uçuşa derin bağlantı, çevrimdışı kabuk.
  - iOS'ta push anahtarı yalnızca standalone modda (`display-mode: standalone` / `navigator.standalone`) gösterilir. Değilse adım adım "Ana Ekrana Ekle" yönergesi çıkar.
  - Bildirim izni sayfa açılışında istenmez; kullanıcı ilk takip kuralını oluştururken, bağlamıyla birlikte ve düğmeyle istenir.

## M6 — Yasal sayfalar, açık veri ve admin (`p3/m6-legal-admin`)
**Yasal sayfalar** (metinler uygulamanın gerçek veri akışlarını anlatır; hukuki inceleme bir dış aktivasyon adımıdır):
- KVKK aydınlatma metni ve gizlilik politikası
- Kullanım koşulları: ADS-B türevi verinin yeniden kullanımını yasaklamaz (ODbL 4.7)
- Veri kaynakları ve atıflar
- Uçak gizliliği kaldırma talebi formu
- **`/hesap-silme`** (giriş gerektirmez, TR/EN): uygulamanın adını anar, neyin silinip neyin tutulduğunu açıklar, e-posta doğrulamasıyla silme talebi alır. Google Play Data safety formuna bu URL yazılır.
- **`/acik-veri`**: ODbL uyumluluğu. adsb.lol'den türetilmiş konum ve iz verisinin günlük dökümü (ya da türetme yöntemi) ücretsiz indirilebilir. Kullanıcı verisi asla dökümde yer almaz.

**Admin paneli:**
- kullanıcılar
- sağlayıcı sağlığı: hız, 429 oranı, gecikme ve tazelik grafikleri; istasyon başına kapsama kalitesi
- bildirim kayıtları
- engel listesi ve kaldırma talepleri
- havayolu ve pist düzeltmeleri
- limitler
- disk kullanımı ve "dolmaya kalan gün"
- yedek durumu
- `REGISTRATION_ENABLED` durumu

## M7 — Güvenlik, performans ve testler (`p3/m7-hardening-web`)
- **CSP ve güvenlik başlıkları:** nonce tabanlı CSP. İzin verilen kaynaklar: harita karo/stil kaynakları, `api.DOMAIN` (WS dahil), push uç noktaları.
- **Performans:**
  - 3.000 uçaklık sentetik senaryo, Playwright ile 30 sn: medyan kare süresi ≤ 20 ms, 200 ms'yi aşan uzun görev yok (PerformanceObserver).
  - Ana sayfa `pnpm lhci` (Lighthouse CI, varsayılan mobil kısıtlama, üretim build'i): 3 koşunun medyanında LCP < 2,5 sn.
  - Yöntemler: tek symbol katmanı, WS'den yalnızca farklar, `requestAnimationFrame` ile ara değerleme, rota bazlı kod bölme.
- **Bileşen ve erişilebilirlik testleri:** bileşen testleri ve axe kontrolleri.
- **Playwright E2E akışları:**
  1. Kayıt → Mailpit'ten kod → giriş.
  2. Uçak ara → takibe al (10 km + iniş) → replay senaryosu → bildirim merkezinde doğru olaylar ve web push gönderim kaydı.
  3. İstasyon panosunda durum geçişleri, muhtemel inişin kesin inişle doğrulanması dahil.
  4. Operasyon panosu filtresi ve otomatik yenileme.
  5. Geçmiş oynatma.
  6. Engel listesine eklenen uçağın haritadan kalkması.
  7. Hesap silme (uygulama içi ve `/hesap-silme`).
  8. TR/EN geçişi ve açık/koyu tema.
- **Görsel kontrol:** ana ekranların ekran görüntüleri alınır (M1'deki boyutlar ve temalar) ve DESIGN.md ile tutarlılığı gözden geçirilir.

## Tamamlanma kriterleri
- [ ] Önceki parçaların kriterleri yeşil.
- [ ] Tüm E2E akışları, axe kontrolleri ve glif kontrolü geçiyor.
- [ ] Performans hedefleri ölçülüp raporlandı.
- [ ] Herkese açık duyuru öncesi kontrol listesi: günlük yedek alınıyor ve bir kez geri yüklendi; disk kullanımı admin panelinde; 30 günlük iz hacmi ölçüldü; yasal metinler yayında. `REGISTRATION_ENABLED=true` yalnızca kullanıcı onayıyla açılır (DUR-SOR).
- [ ] `docs/DESIGN.md` ve `docs/reports/parca-3.md` yazıldı.

## Dış aktivasyon adımları
- Yasal metinlerin bir hukukçu tarafından incelenmesi.
- Opsiyonel: Turnstile anahtarları.
- Herkese açık yayından önce info@adsb.lol'e e-posta: uygulamanın tanımı, istek bütçesi, User-Agent ve ODbL uyum planı.
