---
paths:
  - "apps/mobile/**"
---

# Mobil kurallar

- Expo SDK 57 (`expo` ≥ 57.0.17) ya da DECISIONS'ta kayıtlı daha yeni bir sürüm kullanılır. React sürümünü SDK belirler; web'deki React sabiti mobile uygulanmaz.
- Development build kullanılır; Expo Go hedeflenmez. New Architecture zorunludur.
- Gezinme yapıları `expo-router/react-navigation`'dan import edilir; `@react-navigation/*` import edilmez.
- `@maplibre/maplibre-react-native` v11 API'si kullanılır: `Map`, `GeoJSONSource`, tek `<Layer type=…>`. v10 örneklerini (`MapView`, `ShapeSource`, `SymbolLayer`) kopyalama.
- Android bildirim kanalları (`flight-alerts`, `general`) push token'ı alınmadan önce oluşturulur.
- iOS zamana duyarlılık: push yükünde `interruptionLevel: "time-sensitive"` (tireli), yerel API'de `timeSensitive` kullanılır. `critical` kullanılmaz.
- Atıflar: mobil haritada ADSB.lol (ODbL 1.0, bağlantılı) ve "© OpenMapTiles © OpenStreetMap" her zaman görünür; "Veri kaynakları" ekranı `/acik-veri` bağlantısını içerir.
- Konum izni istenmez. Harita, arama ve uçuş detayı girişsiz çalışır.
- Bu makine Windows'tur: iOS Simulator yoktur. iOS doğrulaması EAS bulut build'i ve gerçek cihazla, kullanıcı tarafından yapılır.
- `eas login`, `eas credentials` ve `eas submit` ile Apple/Google konsol adımları DUR-SOR gerektirir.
