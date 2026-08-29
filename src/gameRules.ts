/** Pure puzzle rules. This module deliberately has no React, DOM, or asset imports. */

export type RandomSource = () => number

export interface Clock {
  now(): number
}

export interface Artwork {
  id: string
  width: number
  height: number
}

export type ArtworkOrientation = 'landscape' | 'portrait' | 'square'

export interface GridSize {
  rows: number
  columns: number
  level: number | null
}

export interface Tile {
  id: number
  correctIndex: number
}

export interface Board {
  rows: number
  columns: number
  tiles: Tile[]
}

export interface TileSelection {
  board: Board
  selectedTileIndex: number | null
  completed: boolean
}

export interface ArtworkChoice {
  artwork: Artwork
  usedArtworkIds: Set<string>
}

export const FIRST_PRACTICE_ARTWORK_ID = 'mona-lisa__leonardo-da-vinci'
export const SECOND_PRACTICE_ARTWORK_ID = 'the-starry-night__vincent-van-gogh'

export function getArtworkOrientation(width: number, height: number): ArtworkOrientation {
  if (width === height) return 'square'
  return width > height ? 'landscape' : 'portrait'
}

export function getGridSize(stage: number, orientation: ArtworkOrientation): GridSize {
  assertStage(stage)
  if (stage <= 2) return { rows: 2, columns: 2, level: null }

  const level = Math.floor((stage - 3) / 5) + 1
  const rows = Math.floor((level + 4) / 2)
  const columns = Math.floor((level + 5) / 2)
  return orientation === 'portrait'
    ? { rows: columns, columns: rows, level }
    : { rows, columns, level }
}

/** Chooses without mutating the caller's used-id set. The caller stores the returned set. */
export function selectArtwork(
  stage: number,
  artworks: readonly Artwork[],
  usedArtworkIds: ReadonlySet<string>,
  random: RandomSource,
): ArtworkChoice {
  assertStage(stage)
  const fixedId = stage === 1 ? FIRST_PRACTICE_ARTWORK_ID : stage === 2 ? SECOND_PRACTICE_ARTWORK_ID : null
  const candidatePool = fixedId
    ? artworks.filter((artwork) => artwork.id === fixedId)
    : artworks.filter((artwork) => !usedArtworkIds.has(artwork.id))

  if (candidatePool.length === 0) {
    throw new Error(fixedId ? `Missing practice artwork: ${fixedId}` : 'No unused artwork is available')
  }
  const randomIndex = chooseIndex(candidatePool.length, random)
  const artwork = candidatePool[randomIndex]
  const nextUsedArtworkIds = new Set(usedArtworkIds)
  nextUsedArtworkIds.add(artwork.id)
  return { artwork, usedArtworkIds: nextUsedArtworkIds }
}

export function createShuffledBoard(rows: number, columns: number, random: RandomSource): Board {
  assertGrid(rows, columns)
  const tiles = Array.from({ length: rows * columns }, (_, index) => ({ id: index, correctIndex: index }))
  const minimumMisplaced = Math.ceil(tiles.length * 0.5)

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const candidate = fisherYates(tiles, random)
    if (countMisplaced(candidate) >= minimumMisplaced) return { rows, columns, tiles: candidate }
  }

  // A broken/constant random source must not make game creation loop forever.
  const fallback = tiles.slice(1).concat(tiles.slice(0, 1))
  return { rows, columns, tiles: fallback }
}

export function isBoardComplete(board: Board): boolean {
  return board.tiles.every((tile, index) => tile.correctIndex === index)
}

export function selectTile(board: Board, selectedTileIndex: number | null, clickedIndex: number): TileSelection {
  assertTileIndex(board, clickedIndex)
  if (selectedTileIndex === null) {
    return { board, selectedTileIndex: clickedIndex, completed: isBoardComplete(board) }
  }
  assertTileIndex(board, selectedTileIndex)
  if (selectedTileIndex === clickedIndex) {
    return { board, selectedTileIndex: null, completed: isBoardComplete(board) }
  }

  const tiles = board.tiles.slice()
  ;[tiles[selectedTileIndex], tiles[clickedIndex]] = [tiles[clickedIndex], tiles[selectedTileIndex]]
  const nextBoard = { ...board, tiles }
  return { board: nextBoard, selectedTileIndex: null, completed: isBoardComplete(nextBoard) }
}

export function elapsedMs(startedAtMs: number, currentAtMs: number): number {
  return Math.max(0, currentAtMs - startedAtMs)
}

export function formatElapsedMs(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  return minutes === 0 ? `${seconds}秒` : `${minutes}分${seconds}秒`
}

function assertStage(stage: number): void {
  if (!Number.isInteger(stage) || stage < 1 || stage > 100) throw new RangeError('stage must be an integer from 1 to 100')
}

function assertGrid(rows: number, columns: number): void {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1) {
    throw new RangeError('rows and columns must be positive integers')
  }
}

function assertTileIndex(board: Board, index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= board.tiles.length) throw new RangeError('tile index is out of range')
}

function chooseIndex(length: number, random: RandomSource): number {
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('random source must return a value in [0, 1)')
  return Math.floor(value * length)
}

function fisherYates(source: readonly Tile[], random: RandomSource): Tile[] {
  const result = source.slice()
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = chooseIndex(index + 1, random)
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function countMisplaced(tiles: readonly Tile[]): number {
  return tiles.reduce((count, tile, index) => count + (tile.correctIndex === index ? 0 : 1), 0)
}
