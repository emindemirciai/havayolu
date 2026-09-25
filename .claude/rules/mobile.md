---
paths:
  - "apps/mobile/**"
---

# Mobil kurallar

- Expo SDK 57 (ya da DECISIONS'ta kayıtlı daha yenisi) ve development build kullanılır; Expo Go hedeflenmez. New Architecture zorunludur.
- Gezinme yapıları `expo-router/react-navigation`'dan import edilir; `@react-navigation/*` import edilmez.
- `@maplibre/maplibre-react-native` v11 API'si kullanılır: `Map`, `GeoJSONSource`, tek `<Layer type=…>`. v10 örneklerini (`MapView`, `ShapeSource`, `SymbolLayer`) kopyalama.
- Android bildirim kanalları (`flight-alerts`, `general`) push token'ı alınmadan önce oluşturulur.
- iOS zamana duyarlılık: push yükünde `interruptionLevel: "time-sensitive"` (tireli), yerel API'de `timeSensitive` kullanılır. `critical` kullanılmaz.
- Konum izni istenmez. Harita, arama ve uçuş detayı girişsiz çalışır.
- Bu makine Windows'tur: iOS Simulator yoktur. iOS doğrulaması EAS bulut build'i ve gerçek cihazla, kullanıcı tarafından yapılır.
- `eas login`, `eas credentials` ve `eas submit` ile Apple/Google konsol adımları DUR-SOR gerektirir.
