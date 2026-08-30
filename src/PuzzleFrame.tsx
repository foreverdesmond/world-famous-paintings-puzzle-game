import type { ReactNode } from 'react'
import type { CSSProperties } from 'react'

export type PuzzleFrameOrientation = 'landscape' | 'portrait'

export const puzzleFrameLayout = {
  defaultHeight: 'min(70svh, 42rem)',
  defaultMinHeight: '16rem',
  landscapeHeight: 'calc(100svh - 11rem)',
  landscapeMinHeight: '12rem',
  landscapeRatio: '4 / 3',
  portraitRatio: '3 / 4',
} as const

export function PuzzleFrame({ children, orientation = 'landscape' }: { children: ReactNode; orientation?: PuzzleFrameOrientation }) {
  const frameRatio = orientation === 'portrait' ? puzzleFrameLayout.portraitRatio : puzzleFrameLayout.landscapeRatio
  return <div className={`puzzle-frame puzzle-frame--${orientation}`} data-testid="puzzle-frame" data-frame-orientation={orientation} data-frame-ratio={frameRatio} data-height-limit={puzzleFrameLayout.defaultHeight} data-landscape-height={puzzleFrameLayout.landscapeHeight} style={{ '--frame-height': puzzleFrameLayout.defaultHeight, '--frame-min-height': puzzleFrameLayout.defaultMinHeight, '--frame-ratio': frameRatio } as CSSProperties}>{children}</div>
}
