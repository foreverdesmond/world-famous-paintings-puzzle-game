import { readFile, readdir } from 'node:fs/promises'
import { basename, join } from 'node:path'

const root = decodeURIComponent(new URL('..', import.meta.url).pathname)
const manifest = await readFile(join(root, 'assets/paintings/manifest.csv'), 'utf8')
const expected = manifest
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.match(/(?:^|,)assets\/paintings\/([^,]+\.jpg),/)?.[1])
  .filter(Boolean)
  .map((file) => basename(file, '.jpg'))

const outputDirectory = join(root, 'dist/assets')
const outputFiles = (await readdir(outputDirectory)).filter((file) => file.endsWith('.jpg'))
if (outputFiles.length !== expected.length) {
  throw new Error(`Expected ${expected.length} emitted JPEGs, found ${outputFiles.length}`)
}

for (const stem of expected) {
  const emitted = outputFiles.find((file) => file === `${stem}.jpg` || file.startsWith(`${stem}-`))
  if (!emitted) throw new Error(`No production asset emitted for ${stem}`)
  const bytes = await readFile(join(outputDirectory, emitted))
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error(`Production asset is not a JPEG: ${emitted}`)
  }
}

console.log(`Verified ${expected.length} manifest JPEGs in dist/assets`)
