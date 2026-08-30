import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import type { Artwork } from './artworkCatalog'
import { PuzzleBoard } from './PuzzleBoard'
import { PreviewArtwork } from './PreviewArtwork'
import { PuzzleFrame } from './PuzzleFrame'
import { puzzleFrameLayout } from './PuzzleFrame'
import type { Board } from './gameRules'

const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

const artwork = (width: number, height: number): Artwork => ({
  id: `${width}x${height}`, title: 'Demo', titleZh: '示例', artist: 'Artist', artistZh: '作者', date: '1900', imagePath: '/demo.jpg', width, height,
})
const board: Board = { rows: 2, columns: 2, tiles: [0, 1, 2, 3].map((id) => ({ id, correctIndex: id })) }

describe('PuzzleFrame responsive container', () => {
  afterEach(cleanup)
  it('caps the frame by viewport height and prevents artwork-size overflow at responsive breakpoints', () => {
    render(<PuzzleFrame><span>content</span></PuzzleFrame>)
    const frame = screen.getByTestId('puzzle-frame')
    expect(css).toMatch(/\.puzzle-frame\s*\{[^}]*width:\s*100%[^}]*height:\s*var\(--frame-height,\s*min\(70svh,\s*42rem\)\)[^}]*min-height:[^}]*overflow:\s*hidden/)
    expect(css).toMatch(/\.puzzle-board\s*\{[^}]*width:\s*min\(100%,\s*62rem\)[^}]*max-height:\s*100%[^}]*overflow:\s*hidden/)
    expect(frame).toHaveStyle(`--frame-height: ${puzzleFrameLayout.defaultHeight}`)
    expect(frame).toHaveStyle(`--frame-min-height: ${puzzleFrameLayout.defaultMinHeight}`)
    expect(frame).toHaveAttribute('data-height-limit', puzzleFrameLayout.defaultHeight)
    expect(frame).toHaveAttribute('data-landscape-height', puzzleFrameLayout.landscapeHeight)
    expect(css).toContain('.puzzle-frame { height: var(--landscape-frame-height, calc(100svh - 11rem)); min-height: 12rem; }')
  })

  it.each([
    { width: 1600, height: 900, ratio: '1600 / 900' },
    { width: 700, height: 1400, ratio: '700 / 1400' },
    { width: 1000, height: 1000, ratio: '1000 / 1000' },
  ])('contains $width x $height artwork without changing its aspect ratio', ({ width, height, ratio }) => {
    render(<PuzzleFrame><PuzzleBoard board={board} artwork={artwork(width, height)} selectedTileIndex={null} onTileClick={() => undefined} /></PuzzleFrame>)
    expect(screen.getByTestId('puzzle-frame')).toHaveClass('puzzle-frame')
    const frame = screen.getByTestId('puzzle-frame')
    const puzzle = screen.getByTestId('puzzle-board')
    expect(puzzle).toHaveStyle(`aspect-ratio: ${ratio}`)
    expect(frame).toContainElement(puzzle)
    expect(css).toMatch(/\.preview-image\s*\{[^}]*max-width:\s*100%[^}]*max-height:\s*100%[^}]*object-fit:\s*contain/)
  })

  it('uses the same bounded frame for a complete preview image', () => {
    render(<PuzzleFrame><PreviewArtwork artwork={artwork(2400, 1200)} /></PuzzleFrame>)
    expect(screen.getByTestId('puzzle-frame')).toContainElement(screen.getByTestId('preview-image'))
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
