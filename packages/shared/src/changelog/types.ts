import type { LocalizedText } from '../locale'

/** Yenilikler sayfasında "Dene →" olarak gösterilen, o sürümde test edilebilecek bir sayfa. */
export interface ChangelogLink {
  path: string
  label: LocalizedText
}

export interface ChangelogEntry {
  /** Semver, "v" öneki olmadan (ör. "0.2.0"). */
  version: string
  /** YYYY-MM-DD (Europe/Istanbul). */
  date: string
  title: LocalizedText
  items: readonly LocalizedText[]
  tryLinks?: readonly ChangelogLink[]
}
