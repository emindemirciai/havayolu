// Depoda CRLF satır sonlu metin dosyası olmadığını doğrular (.cmd/.bat/.ps1 hariç).
// `git ls-files --eol` çıktısında index tarafı "i/crlf" olan satır varsa çıkış kodu 1'dir.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const output = execFileSync('git', ['ls-files', '--eol'], { cwd: root, encoding: 'utf8' })
const offenders = output
  .split('\n')
  .filter((line) => line.startsWith('i/crlf') || line.startsWith('i/mixed'))
  .map((line) => line.split('\t').pop() ?? line)
  .filter((file) => !/\.(cmd|bat|ps1)$/i.test(file))

if (offenders.length > 0) {
  console.error(
    `✗ CRLF ya da karışık satır sonlu dosyalar:\n${offenders.map((f) => `  ${f}`).join('\n')}`,
  )
  process.exit(1)
}
console.log('✓ Satır sonları LF.')
