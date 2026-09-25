import { describe, expect, it } from 'vitest'
import {
  CHANGELOG,
  compareSemver,
  currentVersion,
  renderChangelogMarkdown,
  validateChangelog,
  type ChangelogEntry,
} from './index'

const entry = (version: string, date = '2026-09-25'): ChangelogEntry => ({
  version,
  date,
  title: { tr: 'Başlık', en: 'Title' },
  items: [{ tr: 'Madde', en: 'Item' }],
})

describe('changelog', () => {
  it('gerçek changelog geçerlidir', () => {
    expect(validateChangelog(CHANGELOG)).toEqual([])
  })

  it('semver karşılaştırması sayısal yapılır', () => {
    expect(compareSemver('0.10.0', '0.9.9')).toBeGreaterThan(0)
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0)
    expect(() => compareSemver('v1.0.0', '1.0.0')).toThrow()
  })

  it('sıralama, tarih ve boş metin hatalarını yakalar', () => {
    expect(validateChangelog([entry('0.1.0'), entry('0.2.0')])).toHaveLength(1)
    expect(
      validateChangelog([entry('0.2.0', '2026-09-01'), entry('0.1.0', '2026-09-02')]),
    ).toHaveLength(1)
    expect(validateChangelog([{ ...entry('0.1.0'), title: { tr: '', en: 'x' } }])).toHaveLength(1)
    expect(
      validateChangelog([
        { ...entry('0.1.0'), tryLinks: [{ path: 'https://x', label: { tr: 'a', en: 'b' } }] },
      ]),
    ).toHaveLength(1)
    expect(validateChangelog([])).toHaveLength(1)
  })

  it('güncel sürüm en yeni kayıttır', () => {
    expect(currentVersion([entry('0.3.0'), entry('0.2.0')])).toBe('0.3.0')
  })

  it('markdown her iki dili ve bağlantıları içerir', () => {
    const md = renderChangelogMarkdown([
      { ...entry('0.2.0'), tryLinks: [{ path: '/durum', label: { tr: 'Durum', en: 'Status' } }] },
    ])
    expect(md).toContain('## v0.2.0 — 2026-09-25')
    expect(md).toContain('### Türkçe')
    expect(md).toContain('### English')
    expect(md).toContain('[Durum](/durum)')
    expect(md).toContain('[Status](/durum)')
  })
})
