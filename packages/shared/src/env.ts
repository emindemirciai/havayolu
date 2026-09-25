/**
 * Dokploy env şablonunda (deploy/dokploy.env.example) doldurulacak ya da boş bırakılacak alanlar
 * `ANAHTAR=#talimat#` biçimindedir (D-063). Docker Compose bu metni değer olarak okur; uygulamalar
 * yer tutucuyu "tanımsız" sayar, böylece "boş bırak" yazan satırlar olduğu gibi kalabilir.
 */
export function isEnvPlaceholder(value: unknown): boolean {
  return typeof value === 'string' && /^\s*#.*#\s*$/.test(value)
}

/** Yer tutucu değerleri çıkarılmış env kopyası (şema doğrulamasından önce kullanılır). */
export function withoutEnvPlaceholders(
  source: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const cleaned: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(source)) {
    if (!isEnvPlaceholder(value)) cleaned[key] = value
  }
  return cleaned
}
