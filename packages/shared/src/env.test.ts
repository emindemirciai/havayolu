import { describe, expect, it } from 'vitest'
import { isEnvPlaceholder, withoutEnvPlaceholders } from './env'

describe('env yer tutucuları (#talimat#)', () => {
  it('#…# biçimini yer tutucu sayar, gerçek değerleri saymaz', () => {
    expect(isEnvPlaceholder('#parola üret#')).toBe(true)
    expect(isEnvPlaceholder(' #boş bırak (Parça 2)# ')).toBe(true)
    expect(isEnvPlaceholder('##')).toBe(true)
    expect(isEnvPlaceholder('')).toBe(false)
    expect(isEnvPlaceholder('havayolu')).toBe(false)
    expect(isEnvPlaceholder('#yalnızca-baş')).toBe(false)
    expect(isEnvPlaceholder('abc#def#')).toBe(false)
    expect(isEnvPlaceholder(undefined)).toBe(false)
  })

  it('yer tutucuları çıkarır, diğer değerlere dokunmaz', () => {
    expect(withoutEnvPlaceholders({ A: '#parola üret#', B: 'deger', C: '', D: undefined })).toEqual(
      { B: 'deger', C: '', D: undefined },
    )
  })
})
