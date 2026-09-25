import { PROJECT } from '@havayolu/shared'
import { describe, expect, it } from 'vitest'
import { sourceNoticeComment, sourceNoticeLines } from './source-notice'

describe('sayfa kaynağı bildirimi', () => {
  it('sahibi, repoyu, MIT şartını ve markanın kapsam dışı olduğunu iki dilde yazar', () => {
    const text = sourceNoticeLines('havayolu').join('\n')
    expect(text).toContain(`© ${PROJECT.copyrightYear} ${PROJECT.owner}`)
    expect(text).toContain(PROJECT.repoUrl)
    expect(text).toContain('MIT lisansıyla')
    expect(text).toContain('MIT License')
    expect(text).toContain('5846')
    expect(text).toContain('“havayolu” adı ve logosu')
    expect(text).toContain('The “havayolu” name and logo')
    // MIT'in tek şartı kopyalar ve önemli bölümler içindir; kullanım şarta bağlanmaz.
    expect(text).toContain('tüm kopyaları ya da önemli bölümleri')
    expect(text).toContain('All copies or substantial portions')
    expect(text).not.toMatch(/kullanan|Anyone who uses|site content|sitedeki içerikler/)
  })

  it('geçerli ve kaçamayan tek bir HTML yorumu üretir', () => {
    const comment = sourceNoticeComment('ad--> <script>')
    expect(comment.startsWith('<!--\n')).toBe(true)
    expect(comment.endsWith('\n-->')).toBe(true)
    const inner = comment.slice(4, -3)
    expect(inner).not.toContain('--')
    expect(inner).not.toContain('<')
    expect(inner).not.toContain('>')
  })
})
