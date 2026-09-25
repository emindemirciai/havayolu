// CHANGELOG.md'yi packages/shared/src/changelog/entries.ts kaynağından üretir.
// --check: dosyayı yazmaz; changelog geçerli mi, kök package.json sürümü en yeni kayıtla aynı mı
// ve CHANGELOG.md güncel mi diye bakar. Sorun varsa çıkış kodu 1'dir (CI'da çalışır).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  CHANGELOG,
  currentVersion,
  renderChangelogMarkdown,
  validateChangelog,
} from '../packages/shared/src/changelog/index.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const changelogPath = `${root}CHANGELOG.md`
const pkg = JSON.parse(readFileSync(`${root}package.json`, 'utf8')) as { version: string }
const check = process.argv.includes('--check')

const problems = validateChangelog(CHANGELOG)
const latest = currentVersion()
if (pkg.version !== latest) {
  problems.push(
    `Kök package.json sürümü (${pkg.version}) changelog'daki en yeni sürümle (${latest}) aynı değil.`,
  )
}

const markdown = `${renderChangelogMarkdown(CHANGELOG)}\n`

if (check) {
  let existing = ''
  try {
    existing = readFileSync(changelogPath, 'utf8')
  } catch {
    problems.push('CHANGELOG.md bulunamadı.')
  }
  if (existing && existing !== markdown)
    problems.push('CHANGELOG.md güncel değil; "pnpm changelog" çalıştır.')
} else if (problems.length === 0) {
  writeFileSync(changelogPath, markdown)
  console.log(`CHANGELOG.md yazıldı (v${latest}, ${CHANGELOG.length} sürüm).`)
}

if (problems.length > 0) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'))
  process.exit(1)
}
if (check) console.log(`✓ Changelog tutarlı (v${latest}).`)
