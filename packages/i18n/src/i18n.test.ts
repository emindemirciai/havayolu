import { describe, expect, it } from 'vitest'
import { format, formatDate, getMessages, resolveLocale } from './index'

type Tree = { [key: string]: string | Tree }

function keyPaths(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keyPaths(value, `${prefix}${key}.`),
  )
}

describe('i18n', () => {
  it('tr ve en aynı anahtarlara sahiptir ve hiçbir metin boş değildir', () => {
    const tr = getMessages('tr') as unknown as Tree
    const en = getMessages('en') as unknown as Tree
    expect(keyPaths(en).sort()).toEqual(keyPaths(tr).sort())
    const empty = (tree: Tree) =>
      keyPaths(tree).filter((path) => {
        const value = path
          .split('.')
          .reduce<string | Tree>((node, k) => (node as Tree)[k] as string | Tree, tree)
        return typeof value === 'string' && value.trim() === ''
      })
    expect(empty(tr)).toEqual([])
    expect(empty(en)).toEqual([])
  })

  it('bilinmeyen dil varsayılana düşer', () => {
    expect(resolveLocale('en')).toBe('en')
    expect(resolveLocale('de')).toBe('tr')
    expect(resolveLocale(undefined)).toBe('tr')
  })

  it('yer tutucuları doldurur, eksikte hata verir', () => {
    expect(format('{done} / {total}', { done: 2, total: 14 })).toBe('2 / 14')
    expect(() => format('{missing}', {})).toThrow()
  })

  it('tarihi dile göre biçimlendirir', () => {
    expect(formatDate('2026-09-25', 'tr')).toBe('25 Eylül 2026')
    expect(formatDate('2026-09-25', 'en')).toBe('25 September 2026')
  })
})
