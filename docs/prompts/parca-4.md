# Parça 4 — Mobil uygulama, mağaza hazırlığı ve üretim sertleştirme

**Başlatma:** `@docs/prompts/parca-4.md dosyasındaki Parça 4A'ya başla` (sonra 4B)
**Önce oku:**
- mevcut bütün `docs/reports/parca-*.md` dosyaları
- `docs/spec/domain.md` ve `docs/spec/infra.md`
- `docs/DESIGN.md` (varsa; yoksa `packages/shared/design-tokens` içindeki geçici token'lar)
- `.claude/rules/mobile.md`: bu kural yalnızca `apps/mobile` altında bir dosya okununca yüklenir; iskeleti kurmadan önce elle oku

## Hedef
- **4A:** Android öncelikli minimal uygulama gerçek cihazda push alır. Google Play kapalı testi başlar. Kişisel Play hesabında 12 test kullanıcısının 14 gün kesintisiz testte kalması şart olduğundan bu süre olabildiğince erken başlatılır.
- **4B:** iOS ile özellik eşitliği sağlanır; uygulamalar mağaza incelemesine gönderilebilir. Sistem, üretime benzer ortamda ve aynı bellek limitleriyle yük testinden geçer; izlenebilir ve belgelenmiş olur.

**Sıra notu:** 4A, Parça 3'ten önce de yapılabilir. Önkoşullar:
1. Gizlilik politikası ve `/hesap-silme` yayında olmalı; Parça 3 M6a'dan öne alınır, çünkü Play kapalı testi için ikisi de zorunludur.
2. Test kullanıcılarının e-postaları `REGISTRATION_ALLOWLIST`'e eklenir.
3. Harita Parça 1'deki katmanlarla gelir; filtreler 4B'de eklenir.

Uygulama geçici **tasarım** token'larıyla başlar ve 4B'de DESIGN.md'ye geçer.

## 4A — Minimal mobil (Android önce)

### M1 — Temel kurulum (`p4/m1-mobile-setup`)
- **SDK:** Expo SDK 57 (`expo` ≥ 57.0.17; 58 stabil çıktıysa DECISIONS'a yazarak SDK 58). Bağımlılıklar `npx expo install` ile hizalanır; `expo-router` SDK ile aynı sürümdedir. React sürümünü SDK belirler (web'deki 19.3 mobile zorlanmaz).
- **Mimari:** New Architecture zorunludur; `newArchEnabled` eklenmez. Gezinme yapıları `expo-router/react-navigation`'dan import edilir; `@react-navigation/*` kullanılmaz.
- **Build türü:** Development build kullanılır; Expo Go hedeflenmez. MapLibre'nin native modülü ve Android uzak bildirimleri Expo Go'da çalışmaz.
- **Harita:** `@maplibre/maplibre-react-native` ^11.4, config plugin ile eklenir. Kod **v11 API'siyle** yazılır: `Map`, `GeoJSONSource` ve style-spec paint/layout kullanan tek `<Layer type=…>`.
  - v10 örnekleri (`MapView`, `ShapeSource`, `SymbolLayer`) kullanılmaz.
  - Katman stilleri `packages/shared`'dan web ile ortak gelir.
  - Seçim vurgusu için feature-state değil, veri güdümlü ifadeler kullanılır.
- **pnpm:** Bir RN kütüphanesi izole kurulumda bozulursa `pnpm-workspace.yaml`'a `nodeLinker: hoisted` eklenir ve DECISIONS'a yazılır.
- **`app.config.ts`:** Bundle id/package, API URL ve derin bağlantı alanı env'den gelir. Yalnızca gereken minimum izinler istenir; **konum izni istenmez**. `android.googleServicesFile: process.env.GOOGLE_SERVICES_JSON` (EAS dosya env'i).
- **DUR:** `eas login`, EAS projesi oluşturma ve Firebase/FCM kurulumu kullanıcı adımıdır. İlk `eas build -p android --profile development` kullanıcı tarafından etkileşimli çalıştırılır (keystore üretimi). Sonraki build'leri ajan `--non-interactive` ile başlatır.
- **Kabul:**
  - `npx expo-doctor` 0 hata verir.
  - `npx expo config --type public` izin listesinin snapshot testi geçer.

### M2a — Harita, arama ve uçuş detayı (`p4/m2a-mobile-map`)
- **Ekranlar:** harita (Parça 1 katmanları), arama, uçuş detayı (alt sayfa + tam ekran), "Uçağı ortala".
- **Giriş gerekmez:** Harita, arama ve uçuş detayı girişsiz çalışır (Apple 5.1.1(v)). Hesap yalnızca takip ve bildirim için gerekir.
- **Atıflar:** Harita üzerinde ADSB.lol (ODbL 1.0, bağlantılı) ve "© OpenMapTiles © OpenStreetMap" her zaman görünür.
- **Canlı veri:**
  - WS koparsa üstel bekleme + jitter ile yeniden bağlanılır ve `lastSeq` gönderilir.
  - Uygulama ön plana dönünce veri tazelenir.
  - Son durum önbellekte tutulur; ağ yokken açıklayıcı bir durum gösterilir.
- **Kabul:** jest-expo ekran ve hook testleri CI'da yeşil.

### M2b — Takip, bildirim merkezi ve hesap (`p4/m2b-mobile-account`)
- **Ekranlar:**
  - istasyon panosu
  - takip listesi ve kural düzenleme (tek dokunuşla takip, web'deki varsayılanlarla)
  - bildirim merkezi
  - kimlik ekranları
  - "Verilerimi indir" ve "Hesabı sil": Play ve Apple hesap silme şartı; 4A'da gerekir
  - "Veri kaynakları" ekranı: ADSB.lol ODbL atfı ve `/acik-veri` bağlantısı; push bildirimlerinin ODbL bildirimi bu ekranla karşılanır
- **Platform alışkanlıkları:** alt sayfa, geri hareketi, dinamik yazı boyutu.
- **Kabul:** jest-expo testleri CI'da yeşil.

### M3 — Bildirimler (`p4/m3-mobile-push`)
- **Önkoşul:** FCM kurulumu (kullanıcı) bu kilometre taşından önce yapılır.
- **Android kanalları:** `flight-alerts` (yüksek önem) ve `general` uygulama açılışında, **push token'ı alınmadan önce** oluşturulur. Kanal oluşturulmamışsa Android bildirimi hata vermeden göstermez.
- **İzin:** Kullanıcı ilk takip kuralını oluştururken, neden gerektiği açıklanarak istenir. Expo push token'ı kaydedilir, yenilenir ve çıkışta silinir.
- **Davranış:**
  - Uygulama ön plandayken de bildirim gösterilir (`setNotificationHandler`).
  - Bildirime dokununca ilgili uçuşa derin bağlantıyla gidilir.
  - Eylem düğmeleri (`categoryId: "flight-event"`): "Uçuşu aç" ve "Bu uçuş için sustur". Susturma `/v1/follows/{id}/mute` uç noktasını kullanır.
- **Kabul:**
  - Bildirim yönlendirme mantığının jest-expo testleri CI'da yeşil.
  - `eas build --profile development --platform android` başarılı (kanıt: `eas build:list --json`).
  - `[k]`: gerçek Android cihazda test bildirimi ve bir replay olayı bildirimi alınır (kullanıcı doğrular).

### M4 — Play kapalı test (`p4/m4-play-closed-test`)
- **`eas.json`:** Profiller `development`, `preview`, `production`; her profilin kendi `channel`'ı vardır. `runtimeVersion: { policy: "fingerprint" }` kullanılır; monorepo gürültüsü için `.fingerprintignore` eklenir.
- **Android yayın bölümü** (`docs/MOBILE_RELEASE.md`):
  - FCM v1 hizmet hesabının EAS'a yüklenmesi
  - `eas build` ve `eas submit` (ilk yükleme internal track'e `eas submit` ile yapılabilir)
  - Play Console kapalı test kurulumu: en az 12 test kullanıcısı, 14 gün kesintisiz. Kurumsal Play hesabı bu şarttan muaftır ama D-U-N-S numarası ister.
  - Data safety yanıtları uygulamanın gerçek veri akışlarından hazırlanır. Silme URL'si `/hesap-silme`.
- **DUR:** Play Console, test kullanıcıları ve mağaza metinleri kullanıcı adımıdır.
- **Kabul:** `eas build --profile production --platform android` (AAB) başarılı. `[k]`: AAB kapalı test kanalına yüklendi (kullanıcı doğrular).

## 4B — iOS, mağaza ve sertleştirme

### M5 — iOS ve derin bağlantılar (`p4/m5-ios`)
- **Zamana duyarlı bildirim:**
  - `ios.entitlements`: `com.apple.developer.usernotifications.time-sensitive: true`.
  - Kullanıcı tercihi kapalıysa push `interruptionLevel: "active"` ile gider. **`critical` kullanılmaz** (Apple onayı gerektirir).
  - Push yükünde değer `time-sensitive` (tireli) yazılır; expo-notifications'ın yerel API'si `timeSensitive` (camelCase) kullanır. İkisi karıştırılmaz.
  - Capability senkronu yalnızca Apple girişiyle yapılan etkileşimli bir `eas build -p ios` sırasında olur, CI'da olmaz. ACTIVATION adımı: "capability'yi etkinleştir (etkileşimli eas build ya da portal onay kutusu)".
- **Derin bağlantılar:** iOS Universal Links ve Android App Links uçuş sayfası URL'leri (`/ucus/<flightId>`) için kurulur. `apple-app-site-association` ve `assetlinks.json` web tarafında env değerleriyle sunulur (Apple Team ID, Android imza parmak izi). Kalıcı domain seçilmeden kurulmaz (DUR-SOR 1).
- **Tasarım:** DESIGN.md token'larına uyarlanır. Özgün uygulama ikonu, uyarlanabilir Android ikonu, açılış ekranı ve kısa bir tanıtım akışı hazırlanır. Ayarlar ekranı: sade/uzman, birimler, yerel/UTC, tema, dil, zamana duyarlı bildirim tercihi.
- **iOS'ta doğrulama:** hesap ekranları ve silme akışı.
- **maplibre-react-native bilinen sorunları:**
  - Android'de açık/koyu stil değişiminde `mapStyle` sıcak değiştirilmez; Map yeniden oluşturulur (#1647).
  - İleride bir iOS Notification Service Extension ya da widget eklenirse önce #1650 test edilir.
- **DUR:** Apple Developer Program, App Store Connect kaydı ve APNs anahtarı kullanıcı adımıdır.
- **Kabul:** `[k]`: iOS development build gerçek cihazda açılır, push ve derin bağlantı çalışır (kullanıcı doğrular).

### M6 — Mağaza (`p4/m6-store`)
- **Build yöntemi:** v1'de `mobile.yml` ve OTA kanalları yazılmaz. Build ve submit geliştirici makinesinden elle yapılır (`eas build` / `eas submit`; EAS ücretsiz planında platform başına ayda 15 build). OTA, ilk mağaza sürümünden sonra ayrı bir kilometre taşıdır.
- **`docs/MOBILE_RELEASE.md` tamamlanır:**
  - iOS: TestFlight, App Store gizlilik etiketleri (gerçek veri akışından)
  - App Review notu (İngilizce): "Time-sensitive notifications are sent only for approach and landing alerts that the user sets up for a specific flight, aircraft or airport. They are never used for marketing."
  - mağaza metinleri (TR/EN)

### M7 — Mobil E2E (`p4/m7-maestro`)
- **Önkoşul (kullanıcı):** Android Studio + SDK + x86_64 emülatör ve Maestro CLI kurulur; `adb devices` çalışır.
- **Maestro akışları** Android emülatöründe, replay ile çalışan dev backend'e karşı koşar:
  - Giriş → uçak ara → takibe al → bildirim merkezinde bildirimi gör → uçuş detayına git.
  - Hesap silme akışı.
- **Gerçek cihaz kontrol listesi** (kullanıcı yürütür, ajan rapora işler): push (Android + iOS), derin bağlantılar, zamana duyarlı bildirim, ön planda bildirim, eylem düğmeleri.

### M8 — Üretim sertleştirme (`p4/m8-hardening`)
- **Güvenlik:**
  - Hız limitleri gözden geçirilir.
  - CI'da bağımlılık denetimi yapılır (`pnpm audit`; yüksek seviye bulgu CI'ı kırmızıya döndürür).
  - Konteynerler root olmayan kullanıcıyla ve mümkün olan yerde salt okunur dosya sistemiyle çalışır.
  - Üçüncü taraf action'ların SHA sabitlemesi denetlenir.
- **Yük testi** (üretim VPS'inde değil; yerelde, aynı bellek limitleriyle, üretime benzer compose'a karşı):
  - k6 (`docker run --rm -i grafana/k6`) ile WS'de 200 eşzamanlı istemci, 10 dk. Beklenen: RSS limitlerin %80'inin altında, mesaj gecikmesi p95 < 2 sn. permessage-deflate kararı bu ölçümle verilir. 1.000 istemcili test, kayıtlı kullanıcı sayısı 200'ü geçince yapılır.
  - Ingest'te 2.000 uçak (sentetik).
  - Ölçülen RSS değerlerine göre infra.md bütçesi güncellenir.
  - Üretim VPS'inde yük testi yalnızca kullanıcı onayıyla yapılır (DUR-SOR).
- **Opsiyonel yükseltme** (DUR-SOR + DECISIONS; önce infra.md güncellenir): web ve api Dokploy "Application" olarak (GHCR imaj kaynağı), Swarm health check ve `start-first` güncellemesiyle sıfır kesintili çalışır.
  - postgres, redis ve worker Compose'da kalır.
  - Application'lar compose'un `default` ağına erişemez. Bu yüzden Dokploy ≥ v0.30.0 ağ yönetimiyle projeye özel harici bir ağ (`hy-internal`) oluşturulur; DB ve Redis paylaşılan `dokploy-network`'e asla bağlanmaz.
  - Bu, deploy sözleşmesini (`application.deploy`) değiştirir.
- **`docs/RUNBOOK.md` tamamlanır** — adım adım prosedürler:
  - sağlayıcı kesintisi ve 429 fırtınası (Parça 1'de başladı)
  - adsb.lol API anahtarı istemeye başladı (401/403): besleyici kurulumu ve anahtar etkinleştirme
  - Redis ya da DB sorunları
  - disk dolması (`docker system df`, güvenli temizlik)
  - yedekten geri dönüş
  - OpenFreeMap kesintisi → Protomaps yedeği
  - yeni sağlayıcı ekleme (ticari lisanslı sağlayıcıya geçiş dahil; lisans kaydının 7 alanı)
  - KVM 4'e geçiş
  - domain değişikliği (web push aboneliklerinin ve derin bağlantıların yeniden kurulması)

## Tamamlanma kriterleri
**Ajan doğrular:**
- [ ] Önceki bütün kriterler yeşil.
- [ ] Mobil birim testleri CI'da çalışıyor.
- [ ] Android development, preview ve production (AAB) build'leri EAS'ta başarılı.
- [ ] `npx expo config --type public` çıktısında izinler minimum.
- [ ] Yük testi sonuçları raporda.
- [ ] `docs/RUNBOOK.md`, `docs/MOBILE_RELEASE.md` ve `docs/reports/parca-4.md` yazıldı.
- [ ] `docs/ACTIVATION.md` bütün dış adımları tek listede topluyor.

**Kullanıcı yürütür, ajan hazırlar (`[k]`):**
- [ ] Maestro akışları Android emülatöründe geçiyor.
- [ ] iOS development/preview build (ücretli Apple Developer hesabı gerekir).
- [ ] Gerçek cihazda push, derin bağlantı ve zamana duyarlı bildirim.
- [ ] Play kapalı testi 14 günü doldurdu; üretim erişimi başvurusu yapıldı.
