# Parça 4 — Mobil uygulama, mağaza hazırlığı ve üretim sertleştirme

**Başlatma:** `@docs/prompts/parca-4.md dosyasındaki Parça 4A'ya başla` (sonra 4B)
**Önce oku:** Parça 1–3 raporları, `docs/DESIGN.md`, `docs/spec/domain.md`. `.claude/rules/mobile.md` `apps/mobile` altında otomatik yüklenir.

## Hedef
- **4A:** Android öncelikli minimal uygulama gerçek cihazda push alır. Google Play kapalı testi başlar (kişisel hesapta 12 test kullanıcısı × 14 gün şartı olduğundan saat erken işlemeye başlar).
- **4B:** iOS ile özellik eşitliği sağlanır ve mağaza incelemesine gönderilebilir duruma gelinir. Sistem üretimde yük testinden geçmiş, izlenebilir ve belgelenmiş olur.

**Sıra notu:** 4A, Parça 3'ten önce de yapılabilir. Uygulama o durumda geçici token'larla başlar, 4B'de DESIGN.md'ye geçer. Kullanıcı Play kapalı testini erken başlatmak isterse bu sıra tercih edilir.

## 4A — Minimal mobil (Android önce)

### M1 — Temel kurulum (`p4/m1-mobile-setup`)
- Expo SDK 57 kullanılır (58 stabil çıktıysa DECISIONS'a yazarak SDK 58). Bağımlılıklar `npx expo install` ile hizalanır. `expo-router` SDK ile aynı sürümdedir.
- New Architecture zorunludur; `newArchEnabled` eklenmez. Gezinme yapıları `expo-router/react-navigation`'dan import edilir, `@react-navigation/*` kullanılmaz.
- Development build kullanılır; Expo Go hedeflenmez (MapLibre native modülü ve Android push gerektirir).
- `@maplibre/maplibre-react-native` ^11.4, config plugin ile eklenir. Kod **v11 API'siyle** yazılır: `Map`, `GeoJSONSource` ve style-spec paint/layout kullanan tek `<Layer type=…>`. v10 örnekleri (`MapView`, `ShapeSource`, `SymbolLayer`) kullanılmaz. Katman stilleri `packages/shared`'dan web ile ortak gelir. Seçim vurgusu için feature-state değil, veri güdümlü ifadeler kullanılır.
- pnpm monorepo: bir RN kütüphanesi izole kurulumda bozulursa `pnpm-workspace.yaml`'a `nodeLinker: hoisted` eklenir ve DECISIONS'a yazılır.
- `app.config.ts`: bundle id/package, API URL ve derin bağlantı alanı env'den gelir. Yalnızca gereken minimum izinler istenir. **Konum izni istenmez.**
- **DUR:** `eas login` ve EAS projesi oluşturma kullanıcı adımıdır.

### M2 — Ekranlar ve canlı veri (`p4/m2-mobile-core`)
- **Ekranlar:**
  - Harita: web'deki temel filtre ve katmanlarla.
  - Arama.
  - Uçuş detayı: alt sayfa + tam ekran.
  - İstasyon panosu.
  - Takip listesi ve kural düzenleme.
  - Bildirim merkezi.
  - Kimlik ekranları.
- Platform alışkanlıklarına uyulur: alt sayfa, geri hareketi, dinamik yazı boyutu.
- Harita, arama ve uçuş detayı **giriş gerektirmez**. Hesap yalnızca takip ve bildirim için gerekir (Apple 5.1.1(v)).
- **Canlı veri:**
  - WS koparsa üstel bekleme + jitter ile yeniden bağlanılır ve son `seq` gönderilir.
  - Uygulama ön plana dönünce veri tazelenir.
  - Son durum önbellekte tutulur. Ağ yokken açıklayıcı bir durum gösterilir.

### M3 — Bildirimler (`p4/m3-mobile-push`)
- **Android kanalları** (`flight-alerts` yüksek önem ve `general`) uygulama açılışında, **token alınmadan önce** oluşturulur. Kanal yoksa Android bildirimi sessizce gösterilmez.
- İzin, kullanıcı ilk takip kuralını oluştururken bağlamıyla birlikte istenir. Expo push token'ı kaydedilir, yenilenir ve çıkışta silinir.
- Uygulama ön plandayken de bildirim gösterilir (`setNotificationHandler`).
- Bildirime dokununca ilgili uçuşa derin bağlantıyla gidilir.
- Eylem düğmeleri: "Uçuşu aç" ve "Bu uçuş için sustur".
- **Kabul:**
  - jest-expo + React Native Testing Library testleri CI'da yeşil: bileşenler, hook'lar ve bildirim yönlendirme mantığı.
  - Kullanıcı `eas login` yaptıktan sonra `eas build --profile development --platform android` başarılı olur (kanıt: `eas build:list --json`).
  - Gerçek Android cihazda test bildirimi ve bir replay olayı bildirimi alınır (kullanıcı doğrular).

### M4 — Play kapalı test (`p4/m4-play-closed-test`)
- `eas.json` profilleri: `development`, `preview`, `production`. Her profilin kendi `channel`'ı vardır. `runtimeVersion: { policy: "fingerprint" }` kullanılır ve monorepo gürültüsü için `.fingerprintignore` eklenir.
- `docs/MOBILE_RELEASE.md` (Android kısmı):
  - FCM v1 hizmet hesabının EAS'a yüklenmesi
  - `eas build` ve `eas submit` (ilk yükleme internal track'e `eas submit` ile yapılabilir)
  - Play Console kapalı test kurulumu, 12 test kullanıcısı ve 14 gün
  - Data safety yanıtları: uygulamanın gerçek veri akışlarından hazırlanır; silme URL'si `/hesap-silme`
- **DUR:** Play Console, FCM ve test kullanıcıları kullanıcı adımıdır.

## 4B — iOS, mağaza ve sertleştirme

### M5 — iOS ve derin bağlantılar (`p4/m5-ios`)
- `ios.entitlements`: `com.apple.developer.usernotifications.time-sensitive: true`. Kullanıcı tercihi kapalıysa push `interruptionLevel: "active"` ile gider. **`critical` kullanılmaz** (Apple onayı gerektirir). Push yükünde değer `time-sensitive` (tireli) yazılır. expo-notifications'ın yerel API'si ise `timeSensitive` (camelCase) kullanır; ikisi karıştırılmaz.
- Capability senkronu yalnızca Apple girişiyle yapılan etkileşimli bir `eas build -p ios` sırasında olur. CI'da (non-interactive) olmaz. Bu yüzden ACTIVATION'da şu adım yer alır: "capability'yi etkinleştir (etkileşimli eas build ya da portal onay kutusu)".
- iOS Universal Links ve Android App Links uçuş sayfası URL'leri için kurulur. `apple-app-site-association` ve `assetlinks.json` web tarafında env değerleriyle sunulur (Apple Team ID, Android imza parmak izi).
- Tasarım DESIGN.md token'larına uyarlanır. Özgün uygulama ikonu, uyarlanabilir Android ikonu ve açılış ekranı hazırlanır.
- **Hesap ekranları:** verilerimi indir ve hesabı sil (mağaza zorunluluğu; uygulama içinden başlatılır). Ayarlar: sade/uzman, birimler, yerel/UTC, tema, dil, zamana duyarlı bildirim tercihi. Kısa bir tanıtım akışı eklenir.
- **maplibre-react-native bilinen sorunları:**
  - Android'de açık/koyu stil değişiminde `mapStyle` sıcak değiştirilmez; Map yeniden oluşturulur (#1647).
  - İleride bir iOS Notification Service Extension ya da widget eklenirse önce #1650 test edilir.
- **DUR:** Apple Developer Program, App Store Connect kaydı ve APNs anahtarı kullanıcı adımıdır.

### M6 — Mağaza ve OTA (`p4/m6-store`)
- EAS Update kanalları kullanılır. Yayın: `eas update --channel <c> --message <m> --environment <production|preview>` (`--environment` SDK 55+ için zorunludur). Production'a OTA yalnızca native değişiklik yoksa gönderilir; fingerprint bunu garanti eder.
- `.github/workflows/mobile.yml`: EAS build, submit ve update. Yalnızca elle tetiklenir (`workflow_dispatch`). Secrets: `EXPO_TOKEN`, ASC API anahtarı, Play hizmet hesabı JSON'u.
- `docs/MOBILE_RELEASE.md` tamamlanır:
  - iOS: TestFlight, App Store gizlilik etiketleri (gerçek veri akışından), App Review notu ("zamana duyarlı bildirim yalnızca kullanıcının kurduğu yaklaşma ve iniş uyarıları için kullanılır, pazarlama için asla kullanılmaz")
  - mağaza metinleri (TR/EN)

### M7 — Mobil E2E (`p4/m7-maestro`)
- Maestro akışları **Android emülatöründe**, replay ile çalışan dev backend'e karşı koşar:
  - Giriş → uçak ara → takibe al → uygulama içi bildirimi gör → uçuş detayına git.
  - Hesap silme akışı.
- **Gerçek cihaz kontrol listesi** (kullanıcı yürütür, ajan rapora işler): push (Android + iOS), derin bağlantılar, zamana duyarlı bildirim, ön planda bildirim, eylem düğmeleri.

### M8 — Üretim sertleştirme (`p4/m8-hardening`)
- **Güvenlik:**
  - Hız limitleri gözden geçirilir.
  - CI'da bağımlılık denetimi yapılır (`pnpm audit`, yüksek seviye kırmızı).
  - Konteynerler root olmayan kullanıcıyla çalışır; mümkün olan yerde salt okunur dosya sistemi kullanılır.
  - Üçüncü taraf action'ların SHA sabitlemesi denetlenir.
- **Kaynaklar ve yük testi** — üretim VPS'inde değil; yerelde ya da CI'da, aynı bellek limitleriyle, üretime benzer compose'a karşı:
  - k6 ile WS'de 1.000 eşzamanlı istemci, 10 dk: RSS limitlerin %80'inin altında, mesaj gecikmesi p95 < 2 sn. permessage-deflate kararı bu ölçümle verilir.
  - Ingest'te 2.000 uçak.
  - Ölçülen RSS değerlerine göre infra.md bütçesi güncellenir.
  - Üretim VPS'inde yük testi yalnızca kullanıcı onayıyla yapılır (DUR-SOR).
- **Opsiyonel yükseltme** (DECISIONS'a yaz): web ve api Dokploy "Application" olarak (GHCR imaj kaynağı) çalışır; Swarm health check ve `start-first` güncellemesiyle sıfır kesinti sağlanır. postgres, redis ve worker Compose'da kalır.
- **`docs/RUNBOOK.md`** — adım adım prosedürler:
  - sağlayıcı kesintisi ve 429 fırtınası
  - **adsb.lol API anahtarı istemeye başladı** (401/403): besleyici kurulumu ve anahtar etkinleştirme
  - Redis ya da DB sorunları
  - disk dolması (`docker system df`, güvenli temizlik)
  - yedekten geri dönüş
  - OpenFreeMap kesintisi → Protomaps yedeği
  - yeni sağlayıcı ekleme (ticari lisanslı sağlayıcıya geçiş dahil; lisans kaydı alanları)
  - KVM 4'e geçiş

## Tamamlanma kriterleri
**Ajan doğrular:**
- [ ] Önceki tüm kriterler yeşil.
- [ ] Mobil birim testleri CI'da çalışıyor.
- [ ] Maestro akışları Android emülatöründe geçiyor.
- [ ] Android development ve preview build'leri EAS'ta başarılı.
- [ ] `npx expo config --type public` çıktısında izinler minimum.
- [ ] Yük testi sonuçları raporda.
- [ ] `docs/RUNBOOK.md`, `docs/MOBILE_RELEASE.md` ve `docs/reports/parca-4.md` yazıldı.
- [ ] `docs/ACTIVATION.md` tüm dış adımları tek listede topluyor.

**Kullanıcı yürütür, ajan hazırlar:**
- [ ] iOS development/preview build (ücretli Apple Developer hesabı gerekir).
- [ ] Gerçek cihazda push, derin bağlantı ve zamana duyarlı bildirim.
- [ ] Play kapalı testi 14 günü doldurdu; üretim erişimi başvurusu yapıldı.

## Dış aktivasyon adımları (ACTIVATION'a ekle)
- **Expo:** hesap, EAS projesi, `EXPO_TOKEN`, enhanced push security (access token).
- **Apple:** Developer Program üyeliği (yıllık 99 $), App Store Connect uygulama kaydı, APNs anahtarı (EAS'a), zamana duyarlı capability (etkileşimli build ya da portal).
- **Google:** Play Console hesabı (25 $), Firebase projesi ve FCM v1 hizmet hesabı, 12 test kullanıcısı × 14 gün kapalı test.
- **Derin bağlantılar:** Apple Team ID ve Android imza parmak izi.
- **Mağaza:** görseller ve metinler.
