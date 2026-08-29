import { describe, expect, it } from 'vitest'
import {
  FIRST_PRACTICE_ARTWORK_ID,
  SECOND_PRACTICE_ARTWORK_ID,
  createShuffledBoard,
  elapsedMs,
  formatElapsedMs,
  getArtworkOrientation,
  getGridSize,
  isBoardComplete,
  selectArtwork,
  selectTile,
} from './gameRules'

const randomZero = () => 0
const artwork = (id: string): { id: string; width: number; height: number } => ({ id, width: 1200, height: 800 })

describe('gameRules', () => {
  it('maps practice and boundary stages for landscape and square artwork', () => {
    expect(getGridSize(1, 'landscape')).toEqual({ rows: 2, columns: 2, level: null })
    expect(getGridSize(2, 'square')).toEqual({ rows: 2, columns: 2, level: null })
    expect(getGridSize(3, 'landscape')).toEqual({ rows: 2, columns: 3, level: 1 })
    expect(getGridSize(7, 'landscape')).toEqual({ rows: 2, columns: 3, level: 1 })
    expect(getGridSize(8, 'square')).toEqual({ rows: 3, columns: 3, level: 2 })
    expect(getGridSize(12, 'landscape')).toEqual({ rows: 3, columns: 3, level: 2 })
    expect(getGridSize(13, 'landscape')).toEqual({ rows: 3, columns: 4, level: 3 })
    expect(getGridSize(98, 'square')).toEqual({ rows: 12, columns: 12, level: 20 })
    expect(getGridSize(100, 'landscape')).toEqual({ rows: 12, columns: 12, level: 20 })
  })

  it('swaps rows and columns only for portrait artwork', () => {
    expect(getGridSize(3, 'portrait')).toEqual({ rows: 3, columns: 2, level: 1 })
    expect(getArtworkOrientation(1600, 900)).toBe('landscape')
    expect(getArtworkOrientation(900, 1600)).toBe('portrait')
    expect(getArtworkOrientation(1000, 1000)).toBe('square')
  })

  it('selects fixed practice artworks and immutably tracks used ids', () => {
    const catalog = [artwork(FIRST_PRACTICE_ARTWORK_ID), artwork(SECOND_PRACTICE_ARTWORK_ID), artwork('third')]
    const first = selectArtwork(1, catalog, new Set(), randomZero)
    const second = selectArtwork(2, catalog, first.usedArtworkIds, randomZero)
    expect(first.artwork.id).toBe(FIRST_PRACTICE_ARTWORK_ID)
    expect(second.artwork.id).toBe(SECOND_PRACTICE_ARTWORK_ID)
    expect(first.usedArtworkIds).toEqual(new Set([FIRST_PRACTICE_ARTWORK_ID]))
    expect(second.usedArtworkIds).toEqual(new Set([FIRST_PRACTICE_ARTWORK_ID, SECOND_PRACTICE_ARTWORK_ID]))
  })

  it('selects 100 different artworks from a catalog larger than 100', () => {
    const catalog = [artwork(FIRST_PRACTICE_ARTWORK_ID), artwork(SECOND_PRACTICE_ARTWORK_ID), ...Array.from({ length: 149 }, (_, i) => artwork(`art-${i}`))]
    let used = new Set<string>()
    const selected: string[] = []
    for (let stage = 1; stage <= 100; stage += 1) {
      const choice = selectArtwork(stage, catalog, used, () => 0.999999)
      selected.push(choice.artwork.id)
      used = choice.usedArtworkIds
    }
    expect(selected).toHaveLength(100)
    expect(new Set(selected).size).toBe(100)
    expect(used.size).toBe(100)
  })

  it('creates a non-complete board with at least half its tiles misplaced', () => {
    for (const [rows, columns] of [[2, 2], [3, 4], [12, 12]]) {
      const board = createShuffledBoard(rows, columns, randomZero)
      const misplaced = board.tiles.filter((tile, index) => tile.correctIndex !== index).length
      expect(isBoardComplete(board)).toBe(false)
      expect(misplaced).toBeGreaterThanOrEqual(Math.ceil((rows * columns) / 2))
    }
  })

  it('selects, cancels repeated selection, and swaps two different tiles', () => {
    const board = { rows: 2, columns: 2, tiles: [0, 1, 2, 3].map((id) => ({ id, correctIndex: id })) }
    const selected = selectTile(board, null, 1)
    expect(selected.selectedTileIndex).toBe(1)
    const cancelled = selectTile(board, selected.selectedTileIndex, 1)
    expect(cancelled.selectedTileIndex).toBeNull()
    expect(cancelled.board.tiles).toEqual(board.tiles)
    const swapped = selectTile(board, selected.selectedTileIndex, 3)
    expect(swapped.selectedTileIndex).toBeNull()
    expect(swapped.board.tiles.map((tile) => tile.id)).toEqual([0, 3, 2, 1])
    expect(swapped.completed).toBe(false)
  })

  it('judges completion after the final exchange', () => {
    const board = { rows: 2, columns: 2, tiles: [0, 2, 1, 3].map((id, index) => ({ id, correctIndex: id })) }
    const result = selectTile(board, null, 1)
    const completed = selectTile(result.board, result.selectedTileIndex, 2)
    expect(completed.completed).toBe(true)
    expect(isBoardComplete(completed.board)).toBe(true)
  })

  it('formats elapsed time using floored seconds and minutes', () => {
    expect(elapsedMs(1000, 1000)).toBe(0)
    expect(elapsedMs(5000, 123456)).toBe(118456)
    expect(formatElapsedMs(-1)).toBe('0秒')
    expect(formatElapsedMs(59999)).toBe('59秒')
    expect(formatElapsedMs(60000)).toBe('1分0秒')
    expect(formatElapsedMs(125999)).toBe('2分5秒')
  })
})
