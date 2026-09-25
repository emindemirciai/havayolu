# Dış aktivasyon adımları

Bu dosya, kullanıcının elle yapacağı dış adımların **tek ve canlı** listesidir. Her parça yeni adımlar ekler. Durum: `[ ]` bekliyor, `[x]` tamam, `[-]` bilinçli olarak yapılmıyor.

| Durum | Adım | Env / secret | Nerede | Neyi açar |
|---|---|---|---|---|
| [ ] | GitHub CLI girişi: `gh auth login` | — | Terminal | Repo oluşturma, PR'lar |
| [ ] | Uygulama adı ve domain seçimi | `APP_NAME`, `DOMAIN` | Domain kayıt firması | Üretim yayını, User-Agent, yasal metinler |
| [ ] | İletişim e-postası (adsb.lol User-Agent'ı ve yasal metinler için) | `CONTACT_EMAIL` | — | Ingest (boşsa ingest başlamaz) |
| [ ] | **Erken:** Apple Developer Program üyeliği (yıllık 99 $; kimlik doğrulaması günler sürebilir) | — | developer.apple.com | iOS build, TestFlight, iOS push |
| [ ] | **Erken:** Google Play Console hesabı (25 $). Kişisel hesapta üretim için 12 test kullanıcısı × 14 gün kapalı test şart | — | play.google.com/console | Android yayını |
| [-] | Opsiyonel: kendi ADS-B alıcın (RTL-SDR + anten), adsb.lol'e besleme. **Şimdilik yapılmıyor (D-006).** Kesin teker koyma tespiti ve ileride zorunlu olacak API anahtarı için önerilir | `LOCAL_RECEIVER_URLS`, `ADSBLOL_API_KEY` | Ev/ofis | Kesin iniş tespiti |

## Parça 1'de eklenecekler
Ayrıntılı sıra `docs/DEPLOY_DOKPLOY.md`'de olacak.
- Dokploy ≥ v0.30.7, panel HTTPS domain, 3000 portunu kapatma, Let's Encrypt e-postası
- VPS'te 2 GB swap + `vm.overcommit_memory=1` (tüm projeleri etkiler; bilinçli uygula)
- Dokploy: GitHub sağlayıcısı, Compose servisi (Autodeploy KAPALI), GHCR registry (classic PAT `read:packages`), Environment, domain'ler
- DNS A kayıtları (`DOMAIN`, `api.DOMAIN`)
- Dokploy API token'ı, GitHub `production` environment'ı ve secrets (`DOKPLOY_URL`, `DOKPLOY_API_TOKEN`, `DOKPLOY_COMPOSE_ID`)
- `main` için branch protection
- `pnpm coverage:probe --hours 24` (bilgisayarında 24 saat çalışır)

## Parça 2'de eklenecekler
SMTP + SPF/DKIM, VAPID anahtarları (parola yöneticisine yedek), `ADMIN_EMAIL`, S3 uyumlu yedek deposu (B2/R2) + Dokploy Backups, dış uptime izleme + heartbeat URL'leri, opsiyonel Sentry.

## Parça 3'te eklenecekler
Yasal metinlerin hukukçu incelemesi, opsiyonel Turnstile, herkese açık yayından önce info@adsb.lol'e bilgilendirme e-postası.

## Parça 4'te eklenecekler
Expo hesabı + EAS projesi + `EXPO_TOKEN`, APNs anahtarı, App Store Connect kaydı, Firebase/FCM v1, derin bağlantı kimlikleri (Apple Team ID, Android imza parmak izi), mağaza görselleri ve metinleri.
