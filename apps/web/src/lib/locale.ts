import 'server-only'
import { resolveLocale } from '@ucus/i18n'
import type { Locale } from '@ucus/shared'
import { cookies } from 'next/headers'

export const LOCALE_COOKIE = 'lang'

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  return resolveLocale(store.get(LOCALE_COOKIE)?.value)
}
