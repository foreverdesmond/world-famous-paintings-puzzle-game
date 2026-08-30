import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Board } from './gameRules'
import { getContainedBoardGeometry, PuzzleBoard } from './PuzzleBoard'

const board: Board = { rows: 2, columns: 2, tiles: [0, 1, 2, 3].map((id) => ({ id, correctIndex: id })) }
const artwork = { id: 'demo', title: 'Demo', titleZh: '示例', artist: 'Artist', artistZh: '作者', date: '1900', imagePath: '/demo.jpg', width: 1200, height: 800 }

describe('PuzzleBoard', () => {
  afterEach(cleanup)
  it('renders selection and forwards a second click for exchange', () => {
    const onTileClick = vi.fn()
    const { rerender } = render(<PuzzleBoard board={board} artwork={artwork} selectedTileIndex={null} onTileClick={onTileClick} />)
    const tiles = screen.getAllByRole('button')
    fireEvent.click(tiles[1]); expect(onTileClick).toHaveBeenCalledWith(1)
    rerender(<PuzzleBoard board={board} artwork={artwork} selectedTileIndex={1} onTileClick={onTileClick} />)
    expect(tiles[1]).toHaveClass('is-selected'); fireEvent.click(tiles[3]); expect(onTileClick).toHaveBeenLastCalledWith(3)
  })
  it('forwards a repeated click so the session can cancel selection', () => {
    const onTileClick = vi.fn(); render(<PuzzleBoard board={board} artwork={artwork} selectedTileIndex={2} onTileClick={onTileClick} />)
    fireEvent.click(screen.getAllByRole('button')[2]); expect(onTileClick).toHaveBeenCalledWith(2)
  })
  it('preserves board ratio and maps every tile to the source image', () => {
    render(<PuzzleBoard board={board} artwork={artwork} selectedTileIndex={null} onTileClick={() => undefined} />)
    expect(screen.getByTestId('puzzle-board')).toHaveStyle('aspect-ratio: 1200 / 800'); expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getAllByRole('button').every((tile) => tile.getAttribute('style')?.includes('background-image'))).toBe(true)
  })
  it.each([{ rows: 3, columns: 4 }, { rows: 12, columns: 12 }])('renders $rows x $columns boards without changing the source ratio', ({ rows, columns }) => {
    const largeBoard: Board = { rows, columns, tiles: Array.from({ length: rows * columns }, (_, id) => ({ id, correctIndex: id })) }
    render(<PuzzleBoard board={largeBoard} artwork={artwork} selectedTileIndex={null} onTileClick={() => undefined} />)
    expect(screen.getByTestId('puzzle-board')).toHaveStyle('aspect-ratio: 1200 / 800')
    expect(screen.getAllByRole('button')).toHaveLength(rows * columns)
    expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-grid-gap', '0')
  })
  it('marks the board during the one-shot completion celebration', () => {
    render(<PuzzleBoard board={board} artwork={artwork} selectedTileIndex={null} celebrating onTileClick={() => undefined} />)
    expect(screen.getByTestId('puzzle-board')).toHaveClass('is-celebrating')
  })

  it('computes a contained Mona Lisa board with its real ratio and no overflow', () => {
    const monaLisa = { ...artwork, width: 1920, height: 2861 }
    const geometry = getContainedBoardGeometry(monaLisa.width, monaLisa.height, 'portrait')
    render(<PuzzleBoard board={board} artwork={monaLisa} frameOrientation="portrait" selectedTileIndex={null} onTileClick={() => undefined} />)
    const puzzle = screen.getByTestId('puzzle-board')
    const frameWidth = 300
    const frameHeight = 400
    const renderedWidth = frameWidth * geometry.widthPercent / 100
    const renderedHeight = frameHeight * geometry.heightPercent / 100
    expect(Number(puzzle.dataset.boardWidthPercent)).toBeCloseTo(geometry.widthPercent, 8)
    expect(Number(puzzle.dataset.boardHeightPercent)).toBeCloseTo(geometry.heightPercent, 8)
    expect(renderedWidth / renderedHeight).toBeCloseTo(monaLisa.width / monaLisa.height, 8)
    expect(renderedWidth).toBeLessThanOrEqual(frameWidth)
    expect(renderedHeight).toBeLessThanOrEqual(frameHeight)
    expect(geometry.renderedAspectRatio).toBeCloseTo(monaLisa.width / monaLisa.height, 8)
    expect(puzzle).toHaveStyle(`width: ${geometry.widthPercent}%`)
    expect(puzzle).toHaveStyle(`height: ${geometry.heightPercent}%`)
  })
})
