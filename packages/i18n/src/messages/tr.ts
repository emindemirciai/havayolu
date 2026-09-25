/** Türkçe arayüz metinleri (varsayılan dil). Anahtar yapısı tüm diller için buradan türetilir. */
export const tr = {
  meta: {
    description: 'Türkiye odaklı canlı uçuş takibi, istasyona yaklaşma ve iniş bildirimleri.',
  },
  nav: {
    status: 'Durum',
    changelog: 'Yenilikler',
    language: 'Dil',
    switchTo: 'English',
    mainLabel: 'Ana menü',
  },
  status: {
    title: 'Sistem durumu',
    intro: 'Uygulamanın sürümü, sunucu bağlantısı ve yol haritasındaki ilerleme.',
    appVersion: 'Uygulama sürümü',
    build: 'Derleme',
    environment: 'Ortam',
    api: 'Sunucu (API)',
    apiOk: 'Çalışıyor',
    apiDown: 'Sunucuya ulaşılamıyor',
    apiDownHint: 'Yerelde başlatmak için proje klasöründe “pnpm dev” komutunu çalıştır.',
    apiVersion: 'Sunucu sürümü',
    checkedAt: 'Kontrol zamanı',
    roadmap: 'Yol haritası',
    progress: '{done} / {total} kilometre taşı tamamlandı',
    milestoneStatus: {
      done: 'Tamamlandı',
      in_progress: 'Sürüyor',
      planned: 'Planlandı',
    },
    part: 'Parça',
  },
  changelog: {
    title: 'Yenilikler',
    intro:
      'Her sürümde uygulamaya neler geldiğini buradan takip edebilirsin. Bağlantılarla o sürümde eklenen sayfaları hemen deneyebilirsin.',
    current: 'Güncel sürüm',
    tryIt: 'Dene',
    released: 'Yayın tarihi',
  },
  footer: {
    dataAttributionPrefix: 'Canlı uçuş verisi:',
    license: 'lisansıyla',
    codeName: 'Kod adı',
  },
  errors: {
    notFoundTitle: 'Sayfa bulunamadı',
    notFoundBody: 'Aradığın sayfa yok ya da taşınmış. Durum sayfasından devam edebilirsin.',
    goToStatus: 'Durum sayfasına git',
  },
}

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> }

/** Tüm dillerin uyması gereken metin şekli. */
export type Messages = Widen<typeof tr>
