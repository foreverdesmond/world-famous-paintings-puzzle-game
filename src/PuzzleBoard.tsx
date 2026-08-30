import type { CSSProperties } from 'react'
import type { Artwork } from './artworkCatalog'
import type { Board } from './gameRules'

export type PuzzleBoardFrameOrientation = 'landscape' | 'portrait'

export interface ContainedBoardGeometry {
  widthPercent: number
  heightPercent: number
  renderedAspectRatio: number
}

export function getContainedBoardGeometry(width: number, height: number, frameOrientation: PuzzleBoardFrameOrientation): ContainedBoardGeometry {
  const artworkRatio = width / height
  const frameRatio = frameOrientation === 'portrait' ? 3 / 4 : 4 / 3
  const widthPercent = artworkRatio <= frameRatio ? artworkRatio / frameRatio * 100 : 100
  const heightPercent = artworkRatio <= frameRatio ? 100 : frameRatio / artworkRatio * 100
  return { widthPercent, heightPercent, renderedAspectRatio: (widthPercent / heightPercent) * frameRatio }
}

interface PuzzleBoardProps {
  board: Board
  artwork: Artwork
  selectedTileIndex: number | null
  disabled?: boolean
  celebrating?: boolean
  frameOrientation?: PuzzleBoardFrameOrientation
  onTileClick(index: number): void
}

export function PuzzleBoard({ board, artwork, selectedTileIndex, celebrating = false, disabled = false, frameOrientation = 'landscape', onTileClick }: PuzzleBoardProps) {
  const geometry = getContainedBoardGeometry(artwork.width, artwork.height, frameOrientation)
  return (
    <div className={`puzzle-board${celebrating ? ' is-celebrating' : ''}`} data-testid="puzzle-board" data-grid-gap="0" data-board-width-percent={geometry.widthPercent} data-board-height-percent={geometry.heightPercent} style={{ '--board-columns': board.columns, '--board-rows': board.rows, width: `${geometry.widthPercent}%`, height: `${geometry.heightPercent}%`, aspectRatio: `${artwork.width} / ${artwork.height}` } as CSSProperties} aria-label={`${artwork.titleZh}拼图棋盘`}>
      {board.tiles.map((tile, index) => {
        const correctRow = Math.floor(tile.correctIndex / board.columns)
        const correctColumn = tile.correctIndex % board.columns
        const x = board.columns === 1 ? 0 : (correctColumn / (board.columns - 1)) * 100
        const y = board.rows === 1 ? 0 : (correctRow / (board.rows - 1)) * 100
        return <button className={`puzzle-tile${selectedTileIndex === index ? ' is-selected' : ''}`} key={tile.id} type="button" disabled={disabled} aria-pressed={selectedTileIndex === index} aria-label={`${artwork.titleZh}，第 ${index + 1} 块`} onClick={() => onTileClick(index)} style={{ backgroundImage: `url("${artwork.imagePath}")`, backgroundSize: `${board.columns * 100}% ${board.rows * 100}%`, backgroundPosition: `${x}% ${y}%` }} />
      })}
    </div>
  )
}
