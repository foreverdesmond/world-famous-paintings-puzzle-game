import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type Artwork,
  type Board,
  createShuffledBoard,
  getArtworkOrientation,
  getGridSize,
  selectArtwork,
  selectTile,
} from './gameRules'

export type SessionStatus = 'idle' | 'loading' | 'preview' | 'playing' | 'completed' | 'final-completed' | 'fault'

export interface GameSession {
  stage: number
  usedArtworkIds: ReadonlySet<string>
  artwork: Artwork
  board: Board
  selectedTileIndex: number | null
  startedAtMs: number | null
  finishedAtMs: number | null
}

export interface SessionClock {
  now(): number
  setTimeout(handler: () => void, delayMs: number): unknown
  clearTimeout(handle: unknown): void
  setInterval(handler: () => void, delayMs: number): unknown
  clearInterval(handle: unknown): void
}

export type ImageLoader = (imagePath: string) => Promise<void>

export interface UseGameSessionOptions {
  artworks: readonly Artwork[]
  random?: () => number
  clock?: SessionClock
  loadImage?: ImageLoader
  previewDurationMs?: number
  maxLoadAttempts?: number
  retryDelayMs?: (failedAttempt: number) => number
}

export interface GameSessionController {
  status: SessionStatus
  session: GameSession | null
  elapsedMs: number
  loadAttempt: number
  startGame(): void
  clickTile(index: number): void
  nextStage(): void
  exitGame(): void
}

const DEFAULT_MAX_LOAD_ATTEMPTS = 5
const DEFAULT_RETRY_DELAY_MS = (failedAttempt: number) => failedAttempt * 100

export function createBrowserClock(): SessionClock {
  return {
    now: () => performance.now(),
    setTimeout: (handler, delayMs) => window.setTimeout(handler, delayMs),
    clearTimeout: (handle) => window.clearTimeout(handle as number),
    setInterval: (handler, delayMs) => window.setInterval(handler, delayMs),
    clearInterval: (handle) => window.clearInterval(handle as number),
  }
}

export function loadImageInBrowser(imagePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => reject(new Error(`Unable to load image: ${imagePath}`))
    image.src = imagePath
  })
}

export function useGameSession(options: UseGameSessionOptions): GameSessionController {
  const clock = useMemo(() => options.clock ?? createBrowserClock(), [options.clock])
  const random = options.random ?? Math.random
  const loadImage = options.loadImage ?? loadImageInBrowser
  const previewDurationMs = options.previewDurationMs ?? 5000
  const maxLoadAttempts = options.maxLoadAttempts ?? DEFAULT_MAX_LOAD_ATTEMPTS
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
  const [state, setState] = useState<Pick<GameSessionController, 'status' | 'session' | 'elapsedMs' | 'loadAttempt'>>({
    status: 'idle', session: null, elapsedMs: 0, loadAttempt: 0,
  })
  const generation = useRef(0)
  const timers = useRef<unknown[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach((handle) => clock.clearTimeout(handle))
    timers.current = []
  }, [clock])

  const invalidate = useCallback(() => {
    generation.current += 1
    clearTimers()
  }, [clearTimers])

  const beginStage = useCallback((stage: number, usedArtworkIds: ReadonlySet<string>, token: number) => {
    let choice
    try {
      choice = selectArtwork(stage, options.artworks, usedArtworkIds, random)
    } catch {
      setState({ status: 'fault', session: null, elapsedMs: 0, loadAttempt: 0 })
      return
    }
    const grid = getGridSize(stage, getArtworkOrientation(choice.artwork.width, choice.artwork.height))
    const session: GameSession = {
      stage, usedArtworkIds: choice.usedArtworkIds, artwork: choice.artwork,
      board: createShuffledBoard(grid.rows, grid.columns, random), selectedTileIndex: null,
      startedAtMs: null, finishedAtMs: null,
    }
    setState({ status: 'loading', session, elapsedMs: 0, loadAttempt: 0 })

    const attemptLoad = (attempt: number) => {
      if (generation.current !== token) return
      setState((current) => ({ ...current, loadAttempt: attempt }))
      loadImage(choice.artwork.imagePath ?? '').then(() => {
        if (generation.current !== token) return
        setState((current) => ({ ...current, status: 'preview', loadAttempt: attempt }))
        const previewTimer = clock.setTimeout(() => {
          if (generation.current === token) setState((current) => ({ ...current, status: 'playing' }))
        }, previewDurationMs)
        timers.current.push(previewTimer)
      }).catch(() => {
        if (generation.current !== token) return
        if (attempt >= maxLoadAttempts) {
          setState((current) => ({ ...current, status: 'fault', loadAttempt: attempt }))
          return
        }
        const retryTimer = clock.setTimeout(() => attemptLoad(attempt + 1), retryDelayMs(attempt))
        timers.current.push(retryTimer)
      })
    }
    attemptLoad(1)
  }, [clock, loadImage, maxLoadAttempts, options.artworks, previewDurationMs, random, retryDelayMs])

  const startGame = useCallback(() => {
    invalidate()
    const token = generation.current
    beginStage(1, new Set(), token)
  }, [beginStage, invalidate])

  const clickTile = useCallback((index: number) => {
    setState((current) => {
      if (current.status !== 'playing' || !current.session) return current
      const selected = selectTile(current.session.board, current.session.selectedTileIndex, index)
      const now = clock.now()
      const session = { ...current.session, board: selected.board, selectedTileIndex: selected.selectedTileIndex }
      if (current.session.startedAtMs === null) session.startedAtMs = now
      if (!selected.completed) return { ...current, session, elapsedMs: session.startedAtMs === null ? 0 : now - session.startedAtMs }
      session.finishedAtMs = now
      return { ...current, status: session.stage === 100 ? 'final-completed' : 'completed', session, elapsedMs: session.startedAtMs === null ? 0 : now - session.startedAtMs }
    })
  }, [clock])

  const nextStage = useCallback(() => {
    if (state.status !== 'completed' || !state.session) return
    invalidate()
    const token = generation.current
    beginStage(state.session.stage + 1, state.session.usedArtworkIds, token)
  }, [beginStage, invalidate, state])

  const exitGame = useCallback(() => {
    invalidate()
    setState({ status: 'idle', session: null, elapsedMs: 0, loadAttempt: 0 })
  }, [invalidate])

  useEffect(() => () => invalidate(), [invalidate])

  useEffect(() => {
    if (state.status !== 'playing' || !state.session?.startedAtMs) return
    const interval = clock.setInterval(() => setState((current) => {
      if (!current.session?.startedAtMs || current.status !== 'playing') return current
      return { ...current, elapsedMs: clock.now() - current.session.startedAtMs }
    }), 250)
    return () => clock.clearInterval(interval)
  }, [clock, state.session?.startedAtMs, state.status])

  return { ...state, startGame, clickTile, nextStage, exitGame }
}
