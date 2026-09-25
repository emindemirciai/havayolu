# Parça prompt'ları — nasıl kullanılır

Bu dizindeki dosyalar Claude Code'a verilecek görev tanımlarıdır. Oturum başında otomatik yüklenmezler; bir parçayı başlatırken `@` ile anılırlar. Her zaman geçerli kurallar kök `CLAUDE.md`'dedir.

## Başlamadan önce (bir kez, senin yapacakların)
1. **Kurulum:** Git for Windows, Node 24 LTS, `npm i -g pnpm@12.6.0`, Docker Desktop (WSL 2 ile), GitHub CLI (`gh`), Claude Code.
2. **Repo:** `emindemirciai/havayolu` oluşturuldu (herkese açık, `main` korumalı; D-061). İlk push'u Claude yaptı; bu, `main`'e yapılan tek doğrudan push'tur (D-024).
3. **gh girişi:** `gh auth login` yapıldı (2026-09-25). Claude CI'yı izlemek ve PR'ları yönetmek için bunu kullanır.
4. **Host ve e-posta:** Geçici host'u (mevcut domain'in alt alanı ya da sslip.io) ve `CONTACT_EMAIL` adresini belirle (bkz. `docs/ACTIVATION.md`).
5. **Başlat:** Claude Code'u `C:\PROJELER\havayolu` klasöründe aç ve `@docs/prompts/parca-1.md dosyasındaki Parça 1'e başla` yaz.

## Sıra
| # | Dosya | Çıktı |
|---|---|---|
| 1 | `parca-1.md` | Yayın hattı, bütün servisler (admin ve analiz dahil), canlı harita, arama, kapsama raporu |
| 2 | `parca-2.md` | 2A: olay motoru + **proje sahibine ilk gerçek bildirim** · 2B: hesaplar, takip, kanallar, yedekleme |
| 3 | `parca-3.md` | Web ürününün tamamı: tasarım, operasyon panosu, PWA, yasal sayfalar, admin, CSP |
| 4 | `parca-4.md` | 4A: Android öncelikli minimal uygulama + Play kapalı test · 4B: iOS, mağaza, sertleştirme |
| 5 | `parca-5-opsiyonel.md` | Tarife sağlayıcısı ve ödeme (bütçe kararıyla) |

4A, Parça 3'ten önce de yapılabilir. Önkoşullar `parca-4.md` → "Sıra notu" bölümündedir: gizlilik ve `/hesap-silme` sayfaları öne alınır, test kullanıcıları `REGISTRATION_ALLOWLIST` ile kaydolur.

## Bir oturum nasıl yürür
1. **Yeni parça:** `@docs/prompts/parca-N.md dosyasındaki Parça N'e başla`. Claude planı `docs/plans/parca-N.md`'ye yazar ve **onayını bekler**.
2. **Devam:** `Parça N'e devam et`. Claude plan dosyasından ilk tamamlanmamış kilometre taşını bulur.
3. **Kilometre taşı sonu:** Claude teslimatları hazırlar: sürüm, Yenilikler, README, satır sayısı, yerel önizleme ve zip yedek. Sonra dalı push'lar ve PR açar. **CI yeşilse PR'ı kendisi birleştirir** (senin kararın, 2026-09-25) ve yayını doğrular.
4. **Senin adımların:** Senden bir şey gerekirse (Dokploy ayarı, hesap, gerçek cihaz testi), Claude durur ve sorar. Bu adımlar `docs/ACTIVATION.md`'de birikir.
5. **Bağlam:** Bağlam dolmaya başlarsa `/clear` yap ve 2. adımla devam et; ilerleme plan dosyasındadır.

## Yayın nasıl çalışır
- Birleştirilen her PR üretime yayındır; site 10–20 dk içinde güncellenir.
- `main`'e doğrudan push, force push ve dal silme GitHub'da engellidir. Kendi değişikliğini de bir dalda yapıp PR açarsın; CI yeşil olunca birleşir ve yayına çıkar.
- Dokploy kurulumu bitene kadar (`DEPLOY_ENABLED=false`) CI yeşil kalır ama yayın yapılmaz. İş özetinde "YAYINLANMADI" yazar.
