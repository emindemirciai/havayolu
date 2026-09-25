# Parça prompt'ları — nasıl kullanılır

Bu dizindeki dosyalar Claude Code'a verilecek görev tanımlarıdır. Oturum başında otomatik yüklenmezler; bir parçayı başlatırken `@` ile anılırlar. Her zaman geçerli kurallar kök `CLAUDE.md`'dedir.

## Sıra
| # | Dosya | Çıktı |
|---|---|---|
| 1 | `parca-1.md` | Push → CI → GHCR → Dokploy yayın hattı, canlı harita, arama, 24 saatlik kapsama ölçümü |
| 2 | `parca-2.md` | 2A: olay motoru + **sahibine ilk gerçek bildirim** · 2B: hesaplar, takip, kanallar, yedekleme |
| 3 | `parca-3.md` | Web ürününün tamamı: tasarım, operasyon panosu, PWA, yasal sayfalar, admin, CSP |
| 4 | `parca-4.md` | 4A: Android öncelikli minimal uygulama + Play kapalı test · 4B: iOS, mağaza, sertleştirme |
| 5 | `parca-5-opsiyonel.md` | Tarife sağlayıcısı ve ödeme (bütçe kararıyla) |

4A, Parça 3'ten önce de yapılabilir. Play'in 14 günlük kapalı test süresini erken başlatmak için bu sıra tercih edilebilir.

## Bir oturum nasıl yürür
1. Proje klasöründe Claude Code'u aç (`C:\PROJELER\ucus-takip`).
2. Yeni parça: `@docs/prompts/parca-N.md dosyasındaki Parça N'e başla`. Ajan planı `docs/plans/parca-N.md`'ye yazar ve **onayını bekler**.
3. Devam eden parça: `Parça N'e devam et`. Ajan plan dosyasından ilk tamamlanmamış kilometre taşını bulur.
4. Her kilometre taşının sonunda ajan durur ve özet verir. "Push edip PR açayım mı?" diye sorar.
5. PR'daki CI yeşilse GitHub'da PR'ı **sen** birleştirirsin. Birleştirme = üretime yayın.
6. Bağlam dolmaya başlarsa `/clear` yap ve 3. adımla devam et; ilerleme plan dosyasındadır.

## Senin yapacağın dış adımlar
Tamamı `docs/ACTIVATION.md`'de tek listede durur ve her parçada güncellenir.
