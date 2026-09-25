import '@fontsource/overpass/400.css'
import '@fontsource/overpass/600.css'
import '@fontsource/overpass/800.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './globals.css'

import { getMessages } from '@ucus/i18n'
import { currentVersion } from '@ucus/shared'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { LanguageToggle } from '@/components/language-toggle'
import { appName, getServerEnv } from '@/lib/env'
import { getLocale } from '@/lib/locale'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const name = appName(getServerEnv())
  return {
    title: { default: name, template: `%s · ${name}` },
    description: getMessages(locale).meta.description,
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const t = getMessages(locale)
  const env = getServerEnv()

  return (
    <html lang={locale}>
      <body>
        <header className="site-header">
          <Link href="/durum" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            {appName(env)}
          </Link>
          <nav aria-label={t.nav.mainLabel} className="site-nav">
            <Link href="/durum">{t.nav.status}</Link>
            <Link href="/yenilikler">{t.nav.changelog}</Link>
            <LanguageToggle target={locale === 'tr' ? 'en' : 'tr'} label={t.nav.switchTo} />
          </nav>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <span className="mono">v{currentVersion()}</span>
          <span>
            {t.footer.codeName}: <span className="mono">ucus-takip</span>
          </span>
        </footer>
      </body>
    </html>
  )
}
