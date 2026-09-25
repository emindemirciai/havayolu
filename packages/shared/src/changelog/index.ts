import type { Locale } from '../locale'
import { CHANGELOG } from './entries'
import type { ChangelogEntry } from './types'

export type { ChangelogEntry, ChangelogLink } from './types'
export { CHANGELOG } from './entries'

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

export function parseSemver(version: string): [number, number, number] {
  const match = SEMVER.exec(version)
  if (!match) throw new Error(`Geçersiz sürüm: "${version}" (beklenen: 1.2.3)`)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a)
  const pb = parseSemver(b)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Changelog listesinin tutarlılığını denetler: geçerli semver ve tarih, yinelenmeyen ve
 * yeniden eskiye kesin azalan sürümler, boş olmayan TR/EN metinler, "/" ile başlayan bağlantılar.
 * Sorun listesini döndürür; boş liste = geçerli.
 */
export function validateChangelog(entries: readonly ChangelogEntry[]): string[] {
  const problems: string[] = []
  if (entries.length === 0) problems.push('Changelog boş.')
  entries.forEach((entry, index) => {
    const where = `v${entry.version}`
    if (!SEMVER.test(entry.version)) problems.push(`${where}: sürüm semver değil.`)
    if (!DATE.test(entry.date) || Number.isNaN(Date.parse(entry.date)))
      problems.push(`${where}: tarih YYYY-MM-DD değil.`)
    const texts = [entry.title, ...entry.items, ...(entry.tryLinks ?? []).map((l) => l.label)]
    if (texts.some((t) => t.tr.trim() === '' || t.en.trim() === ''))
      problems.push(`${where}: boş TR/EN metin var.`)
    if (entry.items.length === 0) problems.push(`${where}: madde yok.`)
    for (const link of entry.tryLinks ?? []) {
      if (!link.path.startsWith('/') || link.path.startsWith('//'))
        problems.push(`${where}: bağlantı "/" ile başlayan bir iç yol olmalı (${link.path}).`)
    }
    const next = entries[index + 1]
    if (next && SEMVER.test(entry.version) && SEMVER.test(next.version)) {
      if (compareSemver(entry.version, next.version) <= 0)
        problems.push(`${where}: sürümler yeniden eskiye kesin azalan sırada olmalı.`)
      if (entry.date < next.date) problems.push(`${where}: tarih bir önceki sürümden eski.`)
    }
  })
  return problems
}

/** Uygulamanın güncel sürümü = changelog'daki en yeni kayıt. Kök package.json ile CI'da eşitlenir. */
export function currentVersion(entries: readonly ChangelogEntry[] = CHANGELOG): string {
  const latest = entries[0]
  if (!latest) throw new Error('Changelog boş; güncel sürüm belirlenemiyor.')
  return latest.version
}

const HEADINGS: Record<Locale, string> = { tr: 'Türkçe', en: 'English' }
const TRY_LABEL: Record<Locale, string> = { tr: 'Dene', en: 'Try it' }

/** CHANGELOG.md içeriğini üretir (TR + EN). */
export function renderChangelogMarkdown(entries: readonly ChangelogEntry[] = CHANGELOG): string {
  const lines: string[] = [
    '# Yenilikler / Changelog',
    '',
    '> Bu dosya `packages/shared/src/changelog/entries.ts` kaynağından `pnpm changelog` ile üretilir; elle düzenleme.',
    '> Aynı içerik uygulamada **Yenilikler** (`/yenilikler`) sayfasında görünür.',
    '>',
    '> *Generated from `packages/shared/src/changelog/entries.ts` by `pnpm changelog`; do not edit by hand.*',
    '> *The same content appears in the app’s **What’s new** (`/yenilikler`) page.*',
    '',
  ]
  for (const entry of entries) {
    lines.push('---', '', `## v${entry.version} — ${entry.date}`, '')
    for (const locale of ['tr', 'en'] as const) {
      lines.push(`### ${HEADINGS[locale]}`, `**${entry.title[locale]}**`, '')
      for (const item of entry.items) lines.push(`- ${item[locale]}`)
      if (entry.tryLinks?.length) {
        const links = entry.tryLinks.map((l) => `[${l.label[locale]}](${l.path})`).join(' · ')
        lines.push('', `${TRY_LABEL[locale]}: ${links}`)
      }
      lines.push('')
    }
  }
  return lines.join('\n')
}
