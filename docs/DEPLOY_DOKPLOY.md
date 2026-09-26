# Dokploy kurulumu (bir kez)

Bu adımları bir kez uygularsın. Sonrasında `main`'e birleşen her PR, CI yeşilse kendiliğinden yayına çıkar. Yayın hattının nasıl çalıştığı: `docs/spec/infra.md` → CI/CD, karar D-064.

Kurulum bitene kadar CI yeşil kalır: imajlar derlenir, yayın adımı "YAYINLANMADI: Dokploy kurulumu tamamlanmadı" özetiyle atlanır.

**Önkoşullar**
- DNS kayıtları yayılmış olmalı. Her biri `72.62.53.122` döndürmeli:

  ```bash
  nslookup havayolu.live 1.1.1.1
  ```

  Aynısını `api.havayolu.live`, `admin.havayolu.live`, `analiz.havayolu.live` ve `www.havayolu.live` için de dene.
- VPS'e SSH erişimin ve Dokploy paneline yönetici girişin olmalı.

## 1. Dokploy sürümü ve güvenlik
1. **Sürüm:** Panelde Settings → Web Server'da sürüm en az **v0.30.7** olmalı. Eskiyse güncelle; eski sürümlerde komut enjeksiyonu açıkları var.
2. **Panel alan adı:** Panel HTTPS bir alan adında açılmalı. `http://IP:3000` kullanılmaz.
   - Zaten bir alan adı varsa onu kullan.
   - Yoksa DNS'e örneğin `panel.havayolu.live` için A kaydı ekle ve Settings → Web Server → Domain'e gir.
   - Bu adres GitHub'daki `DOKPLOY_URL` olacak.
3. **Let's Encrypt e-postası:** Settings → Web Server'da gir. Varsayılan `test@localhost.com`'dur, değiştir.
4. **Güvenlik duvarı (SSH):** Docker, yayınladığı portlarda ufw'yi atladığı için `ufw-docker` gerekir. Yalnızca 22, 80 ve 443 açık kalır.
   - **Önce** diğer projelerin dışarıya doğrudan açtığı portları not al; `docker ps` çıktısındaki PORTS sütununa bak.
   - ufw-docker kurulduktan sonra bu portlar kapanır. Gerekiyorsa her birine `sudo ufw-docker allow <konteyner> <port>` ile tek tek izin ver.

   ```bash
   sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
   ```

   ```bash
   sudo wget -O /usr/local/bin/ufw-docker https://github.com/chaifeng/ufw-docker/raw/master/ufw-docker && sudo chmod +x /usr/local/bin/ufw-docker && sudo ufw-docker install
   ```

   ```bash
   sudo ufw enable && sudo systemctl restart ufw
   ```

   Doğrulama: **başka bir ağdan**, örneğin telefonun mobil verisiyle şunu çalıştır. Zaman aşımına uğramalı:

   ```bash
   curl -m 5 http://72.62.53.122:3000
   ```

## 2. Bellek
- `docker stats --no-stream` ile mevcut kullanımı gör.
- havayolu'nun bellek üst sınırlarının toplamı ~2,6 GB. Boşta ölçülen kullanım ~290 MB (yerel üretim denemesi).
- Analiz uygulaması ~150–250 MB ekler.
- Boş bellek 3 GB'ın altındaysa 2 GB swap ve `vm.overcommit_memory=1` ayarlarını değerlendir. Bu ayar bütün projeleri etkiler (ACTIVATION'daki satır).

## 3. havayolu Compose uygulaması
1. **Proje ve servis:** Projects → Create Project `havayolu` → Create Service → **Compose**, ad `havayolu`.
2. **Kaynak:** GitHub sağlayıcısı (Settings → Git → GitHub; yoksa bağla).
   - repo `emindemirciai/havayolu`
   - dal `main`
   - compose dosyası `./docker-compose.yml`
3. **General:**
   - **Autodeploy'u KAPAT.** Varsayılanı açıktır. Açık kalırsa CI'ı beklemeden her push'ta yayına çıkar.
   - Advanced → Isolated Deployments kapalı kalır.
   - "Create env file" açık kalır.
4. **composeId'yi not al:** Servis sayfasının adresindeki son parça.
   - Adres biçimi: `/dashboard/project/<projectId>/environment/<environmentId>/services/compose/<composeId>`
   - Bu değer GitHub'daki `DOKPLOY_COMPOSE_ID` olacak.

## 4. GHCR erişimi (Registry)
1. **PAT oluştur:** github.com → Settings → Developer settings → Personal access tokens → **Tokens (classic)**.
   - Yalnızca `read:packages` yetkisi yeterli.
   - Süre ver, örneğin 1 yıl, ve bitiş tarihini ACTIVATION'a yaz.
2. **Registry'yi ekle:** Dokploy → Settings → Registry → Add.
   - Registry URL `ghcr.io`
   - kullanıcı `emindemirciai`
   - parola: az önce oluşturduğun PAT
   - Dokploy sunucuda `docker login` yapar; compose imajları buradan çeker.

## 5. Environment
1. **Bloğu yapıştır:** Compose → Environment'a `deploy/dokploy.env.example` bloğunu yapıştır.
2. **`#…#` talimatlarını izle (D-063):**
   - `#parola üret#` yazan yerlerde `#…#` kısmını silip değeri yaz.
   - `#boş bırak…#` ve ileri parçaları gösteren satırlar olduğu gibi kalabilir.
3. **Sırları ilk deploy'dan ÖNCE gir:** `ADMIN_SETUP_TOKEN`, `POSTGRES_PASSWORD`, `REDIS_QUEUE_PASSWORD`, `REDIS_LIVE_PASSWORD`.
   - Postgres parolası ilk açılışta veritabanına yazılır.
   - Yalnızca `[A-Za-z0-9_-]` kullan. Her sır için ayrı üret ve parola yöneticine kaydet:

     ```powershell
     $b = New-Object byte[] 36; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b).Replace('+','-').Replace('/','_').TrimEnd('=')
     ```

4. **Kopyalama:** `.env.example`'ı kopyalama (D-060). `GIT_SHA` ve `BUILD_TIME` girilmez.

## 6. Alan adları (Domains)
Compose servisinin Domains sekmesinde her satır için HTTPS açık, sertifika Let's Encrypt:

| Servis | Alan adı | Port |
|---|---|---|
| `hy-web` | `havayolu.live` | 3000 |
| `hy-web` | `www.havayolu.live` (uygulama köke 308 ile yönlendirir) | 3000 |
| `hy-web` | `admin.havayolu.live` | 3000 |
| `hy-api` | `api.havayolu.live` | 4000 |

Alan adı değişikliğinden sonra yeniden deploy gerekir.

## 7. Analiz uygulaması (Siteni Analiz Et)
1. **Servis:** Aynı projede ikinci bir **Compose** servisi, ad `analiz`.
   - kaynak `emindemirciai/Analyze.Your.Site-Siteni-Analiz-Et-`, dal `main`
   - compose dosyası o reponun `docker-compose.yml`'si
2. **Environment:** `deploy/analiz.env.example` bloğu.
3. **Domain:** servis `analyze` → `analiz.havayolu.live`, port 3000, HTTPS.
4. **Not:** Bu uygulama kendi modelinde sunucuda derlenir. Derleme sırasında kısa bir CPU/RAM artışı olur.
5. **Giriş:** havayolu API'si ayakta olmalı; analiz paneline girişi o doğrular.

## 8. Dokploy API anahtarı
1. **Anahtarı oluştur:** Settings → Profile → API/CLI → Generate.
   - ad `github-actions`
   - süre **90 gün**
   - organizasyonu seç
   - Bitiş tarihini ACTIVATION'a yaz.
2. **Önerilen:** Anahtarı yalnızca bu projeye erişimi olan bir "deploy-bot" üyesiyle üret.
   - Kapsamı dene: anahtarla başka bir projenin servisini okumaya çalış, 401/403 beklenir.
   - 200 dönerse anahtarı kullanma, bana haber ver.

## 9. GitHub secrets ve variables
Aşağıdaki komutlar değeri sorar; değer komut geçmişine yazılmaz. Aynısı GitHub'da Settings → Secrets and variables → Actions'tan da yapılabilir.

```bash
gh secret set DOKPLOY_URL --repo emindemirciai/havayolu
```

```bash
gh secret set DOKPLOY_API_TOKEN --repo emindemirciai/havayolu
```

```bash
gh secret set DOKPLOY_COMPOSE_ID --repo emindemirciai/havayolu
```

```bash
gh variable set WEB_URL --repo emindemirciai/havayolu --body https://havayolu.live
```

```bash
gh variable set API_URL --repo emindemirciai/havayolu --body https://api.havayolu.live
```

```bash
gh variable set DEPLOY_ENABLED --repo emindemirciai/havayolu --body false
```

Repo herkese açıktır; fork'tan gelen PR'lara secrets verilmez, yayın yalnızca `main`'de çalışır (D-061).

## 10. Deneme ve ilk yayın
1. **Deneme derlemesi:** Yalnızca `sha-<7>` etiketli imajları derler ve gönderir, yayınlamaz:

   ```bash
   gh workflow run deploy.yml --repo emindemirciai/havayolu --ref main -f dry_run=true
   ```

2. **Yayını aç:** Actions'ta iş yeşil bitince yayını aç:

   ```bash
   gh variable set DEPLOY_ENABLED --repo emindemirciai/havayolu --body true
   ```

3. **İlk yayın:** `release` işi `:main` etiketini taşır, Dokploy'u tetikler; `/version`, `/api/version` ve `/ready` doğrulanana kadar bekler (en fazla ~30 dk).

   ```bash
   gh workflow run deploy.yml --repo emindemirciai/havayolu --ref main -f dry_run=false
   ```

Bundan sonra her birleşen PR aynı yolu kendiliğinden izler.

## 11. Doğrulama listesi
- **API sürümü:** Yeni `gitSha` görünmeli:

  ```bash
  curl https://api.havayolu.live/version
  ```

- **Web:** https://havayolu.live/durum sayfasında API "Çalışıyor" görünmeli, sürüm doğru olmalı.
- **Yönetim:** https://admin.havayolu.live açılmalı; `ADMIN_EMAIL` ve kurulum anahtarıyla giriş yap, Servisler panelinde bütün servisler "Çalışıyor" olmalı.
- **Analiz:** https://analiz.havayolu.live/login açılmalı ve aynı yönetici hesabıyla girilmeli. `https://analiz.havayolu.live/api/health` 200 dönmeli.

## 12. Bilmen gerekenler
- **Kesinti:** Yayın sırasında birkaç saniyelik kesinti olur. Compose yayını sıfır kesintili değildir.
- **Geri alma:** Önceki bir commit'e dönmek için:

  ```bash
  gh workflow run rollback.yml --repo emindemirciai/havayolu --ref main -f sha=<en az 7 karakter>
  ```

  - Seçilen imajlar `:main` olur ve aynı doğrulama yapılır.
  - Veritabanı şeması geri alınmaz; şema değişiklikleri geriye uyumludur.
  - Sonraki birleşme `main`'i yeniden ileri alır.
- **Parola unutulursa:** Bir parola `#…#` talimatıyla kaldıysa API açılmaz; Dokploy logunda hangisi olduğu yazar.
  - Postgres parolası yanlış girildiyse ve henüz veri yoksa en kolayı `hy_pgdata` volume'unu silip yeniden deploy etmektir.
  - Bu işlem veriyi siler; veri varsa önce bana sor.
- **İzleme:** Kendi kurduğun Dokploy'da geçmiş metrik ve uyarı yok. Dış bir uptime kontrolü, örneğin UptimeRobot, dakikada bir `https://havayolu.live` ve `https://api.havayolu.live/ready` adreslerine bakmalı (ACTIVATION).
