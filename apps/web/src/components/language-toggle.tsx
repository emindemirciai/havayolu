'use client'

import type { Locale } from '@havayolu/shared'
import { usePathname } from 'next/navigation'

/** Dil tercihini çerezle kaydeden /dil uç noktasına gider ve aynı sayfaya geri döner. */
export function LanguageToggle({ target, label }: { target: Locale; label: string }) {
  const pathname = usePathname() || '/durum'
  const href = `/dil?to=${target}&next=${encodeURIComponent(pathname)}`
  return (
    <a href={href} hrefLang={target} lang={target} className="lang-toggle">
      {label}
    </a>
  )
}
