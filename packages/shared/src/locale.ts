export const LOCALES = ['tr', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'tr'

/** Her iki dilde metin taşıyan içerik (changelog, yol haritası gibi veri kaynakları için). */
export interface LocalizedText {
  tr: string
  en: string
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function pickText(text: LocalizedText, locale: Locale): string {
  return text[locale]
}
