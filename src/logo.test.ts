import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const logoPath = resolve(process.cwd(), 'src/assets/logo.svg')

const readLogo = () => readFileSync(logoPath, 'utf8')

describe('logo asset', () => {
  it('exists as an SVG document', () => {
    expect(() => readLogo()).not.toThrow()
    expect(readLogo()).toMatch(/^<svg[\s>]/)
  })

  it('declares a viewBox on the root svg element', () => {
    expect(readLogo()).toMatch(/^<svg\b[^>]*\bviewBox="[^"]+"/)
  })
})
