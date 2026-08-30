import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import type { Artwork } from './artworkCatalog'
import { PuzzleBoard } from './PuzzleBoard'
import { PreviewArtwork } from './PreviewArtwork'
import { PuzzleFrame } from './PuzzleFrame'
import { puzzleFrameLayout } from './PuzzleFrame'
import type { Board } from './gameRules'

const artwork = (width: number, height: number): Artwork => ({
  id: `${width}x${height}`, title: 'Demo', titleZh: '示例', artist: 'Artist', artistZh: '作者', date: '1900', imagePath: '/demo.jpg', width, height,
})
const board: Board = { rows: 2, columns: 2, tiles: [0, 1, 2, 3].map((id) => ({ id, correctIndex: id })) }

describe('PuzzleFrame responsive container', () => {
  afterEach(cleanup)
  it('caps the frame by viewport height and prevents artwork-size overflow at responsive breakpoints', () => {
    render(<PuzzleFrame><span>content</span></PuzzleFrame>)
    const frame = screen.getByTestId('puzzle-frame')
    expect(frame).toHaveStyle(`--frame-height: ${puzzleFrameLayout.defaultHeight}`)
    expect(frame).toHaveStyle(`--frame-min-height: ${puzzleFrameLayout.defaultMinHeight}`)
    expect(frame).toHaveAttribute('data-height-limit', puzzleFrameLayout.defaultHeight)
    expect(frame).toHaveAttribute('data-landscape-height', puzzleFrameLayout.landscapeHeight)
  })

  it.each([
    { width: 1600, height: 900, ratio: '1600 / 900' },
    { width: 700, height: 1400, ratio: '700 / 1400' },
    { width: 1000, height: 1000, ratio: '1000 / 1000' },
  ])('contains $width x $height artwork without changing its aspect ratio', ({ width, height, ratio }) => {
    render(<PuzzleFrame><PuzzleBoard board={board} artwork={artwork(width, height)} selectedTileIndex={null} onTileClick={() => undefined} /></PuzzleFrame>)
    expect(screen.getByTestId('puzzle-frame')).toHaveClass('puzzle-frame')
    expect(screen.getByTestId('puzzle-board')).toHaveStyle(`aspect-ratio: ${ratio}`)
  })

  it('uses the same bounded frame for a complete preview image', () => {
    render(<PuzzleFrame><PreviewArtwork artwork={artwork(2400, 1200)} /></PuzzleFrame>)
    expect(screen.getByTestId('puzzle-frame')).toContainElement(screen.getByTestId('preview-image'))
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
