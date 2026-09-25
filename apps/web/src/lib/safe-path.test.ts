import { describe, expect, it } from 'vitest'
import { DEFAULT_PATH, safeNextPath } from './safe-path'

describe('safeNextPath', () => {
  it('göreli iç yolları korur', () => {
    expect(safeNextPath('/yenilikler')).toBe('/yenilikler')
    expect(safeNextPath('/durum?x=1')).toBe('/durum?x=1')
  })

  it('dış ya da tehlikeli hedefleri reddeder', () => {
    for (const value of [
      'https://evil.example',
      '//evil.example',
      '/\\evil',
      'yenilikler',
      '',
      null,
      undefined,
      '/a\nb',
    ]) {
      expect(safeNextPath(value)).toBe(DEFAULT_PATH)
    }
  })
})
