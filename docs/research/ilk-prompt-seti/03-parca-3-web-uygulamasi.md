# Parça 3/4 — Web uygulamasının tamamı

Önce `CLAUDE.md` dosyasını ve Parça 1–2 raporlarını oku. Bu parça bittiğinde web tarafı, herkese açık bir ürün olarak eksiksiz çalışır:
- kayıt, takip, bildirimler
- canlı harita, istasyon panosu, geçmiş oynatma
- admin paneli ve yasal sayfalar

## 1. Tasarım sistemi — önce plan, sonra kod

**`docs/DESIGN.md` içeriği:**
- 4–6 renklik, adlandırılmış palet (açık ve koyu tema)
- tipografi rolleri
- yerleşim ilkesi
- bileşen token'ları

Kodlamaya başlamadan önce planı şu soruyla gözden geçir: "Bu, benzer her projede de çıkacak varsayılan bir çözüm mü?" Varsayılan kalan kısımları değiştir ve nedenini yaz.

**Görsel dil konunun kendisinden gelsin:**
- havacılık haritaları: seyrüsefer haritası renkleri, yaklaşma çemberleri
- meydan levhaları: sarı-siyah, durum etiketlerinde ölçülü kullan
- koyu temada kokpit navigasyon ekranının renk anlamları

**Kaçınılacak kalıplar:**
- krem zemin + kiremit vurgu
- siyah zemin + tek asit yeşili vurgu
- her şeyi aynı yuvarlak kartlara bölen SaaS görünümü
- başlıkların üstüne BÜYÜK HARF etiketler
- dekoratif gradyanlar

**Tipografi:**
- En fazla iki yazı tipi ailesi kullan; bilinçli seç.
- Aileler Türkçe karakterleri (ğ ş ı İ ç ö ü) eksiksiz desteklemeli.
- Saat, irtifa ve hız için tabular rakamlar kullan.
- Veri için aday: B612 (Airbus kokpit ekranları için tasarlanmış, açık lisanslı).
- Arayüz için aday: levha karakterli bir sans.
- Türkçe glif desteğini doğrula. Eksikse alternatif seç ve DECISIONS'a yaz.

**Hareket:**
- Cesareti tek bir yerde harca: istasyonun yaklaşma çemberi ve teker koyma anı için tek, kurgulanmış bir animasyon.
- Arayüzün geri kalanı sakin ve disiplinli kalsın.
- `prefers-reduced-motion` ayarına uy.

**Erişilebilirlik (WCAG 2.1 AA):**
- yeterli kontrast
- klavyeyle tam kullanım ve görünür odak
- ekran okuyucu etiketleri
- panolarda gerçek tablo yapısı

## 2. Arayüz metinleri
- Türkçe, cümle düzeninde ve etken çatıyla yaz ("Takibe al", "Bildirimi kapat").
- Aynı eylem, akış boyunca aynı adı taşır.
- Hata mesajları özür dilemez; ne olduğunu ve nasıl düzeltileceğini söyler.
- Boş ekranlar eyleme çağırır. Örnek: "Henüz takip ettiğin uçuş yok. Sefer numarası ya da tescil ile ara."
- Tahmini bilgi her zaman "tahmini" olarak etiketlenir.

## 3. Sayfalar

### Ana sayfa
- Ürünün ne yaptığını gerçek canlı veriyle gösterir: canlı mini harita ve bir istasyonun anlık varış durumu.
- Kayıt çağrısı içerir.
- SEO meta etiketleri ve TR/EN dil desteği vardır.

### Canlı harita (tam ekran)
**Arama:** sefer no, çağrı kodu, tescil, havalimanı.

**Filtreler:** havayolu, tip, irtifa bandı, yerde/havada, kategori.

**Katmanlar:** etiketler, irtifaya göre renklenen iz, istasyon yaklaşma çemberleri.

**Seçili uçak paneli:**
- kimlik bilgileri
- tahmini rota
- canlı değerler
- varışa mesafe ve ETA
- olay zaman çizelgesi
- son 30 dakikanın irtifa/hız grafiği

**"Takibe al" akışı:** eşik seçimi, izlenecek olaylar ve bildirim kanalları.

### Sade / Uzman görünüm anahtarı
- **Sade:** durum, ETA, rota.
- **Uzman:** bunlara ek olarak squawk, dikey hız, pist, QNH, alan üstü yükseklik yöntemi, veri kaynağı ve tazelik.

### Uçuş sayfası (paylaşılabilir URL)
- İz, grafikler ve olaylar.
- Geçmiş oynatma: zaman çubuğu ve 1×–60× hız.

### İstasyon sayfası
**Varış panosu sütunları:** sefer/çağrı kodu, tescil, tip, tahmini kalkış meydanı, mesafe, ETA, durum.

**Durum değerleri:** seyirde / yaklaşmada / teker koydu (saatiyle) / pas geçti.

**Diğer bölümler:**
- son 2 saatin inişleri
- çözümlenmiş METAR/TAF
- yaklaşma haritası
- filtreli istasyon takibi

### Kullanıcı sayfaları
- Takip listem ve bildirim merkezi.
- Ayarlar: dil, birimler, yerel/UTC saat, tema, kanallar, web push izni, sessiz saatler.
- Hesap: e-posta, şifre, verilerimi indir, hesabı sil.
- Kimlik sayfaları: kayıt, doğrulama, giriş, şifre sıfırlama.

### Yasal sayfalar
- KVKK aydınlatma metni ve gizlilik politikası
- Kullanım koşulları
- Veri kaynakları ve atıflar
- Uçak gizliliği kaldırma talebi formu

Metinler uygulamanın gerçek veri akışlarını anlatmalı. Hukuki inceleme bir dış aktivasyon adımıdır.

### Admin paneli
- kullanıcılar
- sağlayıcı sağlığı: hız, 429 sayısı, gecikme ve tazelik grafikleri
- bildirim kayıtları
- engel listesi ve kaldırma talepleri
- havayolu eşleme düzeltmeleri
- limitler ve disk kullanımı

## 4. PWA ve Web Push
- **Uygulama kabuğu:** manifest ve özgün ikon seti.
- **Service worker:**
  - push bildirimlerini gösterir
  - bildirime tıklanınca ilgili uçuşa derin bağlantıyla gider
  - çevrimdışı kabuk sunar
- **iPhone:** Web push için "ana ekrana ekle" yönlendirmesi göster.
- **İzin zamanlaması:** Bildirim iznini sayfa açılır açılmaz isteme. Kullanıcı ilk takip kuralını oluştururken, bağlamıyla birlikte iste.

## 5. Performans
**Hedefler:**
- 3.000+ uçakta harita akıcı kalmalı.
- Ana sayfada LCP < 2,5 sn (4G profili).

**Yöntemler:**
- tek bir symbol katmanı
- WS üzerinden yalnızca farklar
- `requestAnimationFrame` ile ara değerleme
- rota bazlı kod bölme

Ölçüm sonuçlarını rapora yaz.

## 6. Testler
**Bileşen ve erişilebilirlik:** bileşen testleri; axe ile erişilebilirlik kontrolleri.

**Playwright E2E akışları:**
1. Kayıt → Mailpit'ten kod → giriş.
2. Uçak ara → takibe al (10 km + teker koyma) → replay senaryosu → bildirim merkezinde doğru olaylar ve web push gönderim kaydı.
3. İstasyon panosunda durum geçişleri.
4. Geçmiş oynatma.
5. Engel listesine eklenen uçağın haritadan kalkması.
6. Hesap silme.
7. TR/EN geçişi ve açık/koyu tema.

**Görsel kontrol:** Ana ekranların ekran görüntülerini al ve `DESIGN.md` ile tutarlılığını kendin gözden geçir.

## Tamamlanma kriterleri
- [ ] Önceki parçaların kriterleri yeşil.
- [ ] Tüm E2E akışları ve axe kontrolleri geçiyor.
- [ ] Performans hedefleri ölçülüp raporlandı.
- [ ] `DESIGN.md` ve `docs/reports/parca-3.md` yazıldı.

## Dış aktivasyon adımları
- Yasal metinlerin bir hukukçu tarafından incelenmesi.
