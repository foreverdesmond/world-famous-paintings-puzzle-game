import type { ReactNode } from 'react'
import type { CSSProperties } from 'react'

export const puzzleFrameLayout = {
  defaultHeight: 'min(70svh, 42rem)',
  defaultMinHeight: '16rem',
  landscapeHeight: 'calc(100svh - 11rem)',
  landscapeMinHeight: '12rem',
} as const

export function PuzzleFrame({ children }: { children: ReactNode }) {
  return <div className="puzzle-frame" data-testid="puzzle-frame" data-height-limit={puzzleFrameLayout.defaultHeight} data-landscape-height={puzzleFrameLayout.landscapeHeight} style={{ '--frame-height': puzzleFrameLayout.defaultHeight, '--frame-min-height': puzzleFrameLayout.defaultMinHeight } as CSSProperties}>{children}</div>
}
