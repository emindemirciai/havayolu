// Temiz repo yedeği: yalnızca commit'li dosyalar (git archive), sürüm ve tarihle adlandırılır.
// Varsayılan hedef: repo'nun yanındaki "havayolu-yedek" klasörü (BACKUP_DIR ile değiştirilebilir).
// Commit'lenmemiş değişiklik varsa uyarır; o değişiklikler zip'e girmez.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date())
const sha = git('rev-parse', '--short', 'HEAD')
const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
const targetDir = resolve(process.env.BACKUP_DIR ?? join(root, '..', 'havayolu-yedek'))
mkdirSync(targetDir, { recursive: true })

const dirty = git('status', '--porcelain')
if (dirty) {
  console.warn("! Commit'lenmemiş değişiklikler var; bunlar yedeğe GİRMEZ:")
  console.warn(
    dirty
      .split('\n')
      .map((l) => `    ${l}`)
      .join('\n'),
  )
}

const file = join(targetDir, `havayolu-v${pkg.version}-${date}-${sha}.zip`)
git('archive', '--format=zip', '--prefix=havayolu/', '-o', file, 'HEAD')
const sizeKb = Math.round(statSync(file).size / 1024)
console.log(`✓ Yedek: ${file}`)
console.log(
  `  sürüm v${pkg.version} · dal ${branch} · commit ${sha} · ${sizeKb.toLocaleString('tr-TR')} KB`,
)
