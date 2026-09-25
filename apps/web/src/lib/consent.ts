/** Analiz onayı çerezi ve olayı (sunucu ve istemci bileşenleri ortak kullanır). */
export type ConsentValue = 'granted' | 'denied'
export const CONSENT_COOKIE = 'hy_consent'
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180
export const OPEN_CONSENT_EVENT = 'hy:open-consent'

export function parseConsent(value: string | undefined): ConsentValue | null {
  return value === 'granted' || value === 'denied' ? value : null
}
