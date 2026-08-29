import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Artwork } from './gameRules'
import { useGameSession, type SessionClock } from './useGameSession'

class FakeClock implements SessionClock {
  time = 0
  private nextId = 1
  private timers = new Map<number, { at: number; callback: () => void; interval?: number }>()
  now = () => this.time
  setTimeout = (callback: () => void, delayMs: number) => {
    const id = this.nextId++
    this.timers.set(id, { at: this.time + delayMs, callback })
    return id
  }
  clearTimeout = (handle: unknown) => { this.timers.delete(handle as number) }
  setInterval = (callback: () => void, delayMs: number) => {
    const id = this.nextId++
    this.timers.set(id, { at: this.time + delayMs, callback, interval: delayMs })
    return id
  }
  clearInterval = (handle: unknown) => { this.timers.delete(handle as number) }
  advanceBy(ms: number) {
    const target = this.time + ms
    while (true) {
      const due = [...this.timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0]
      if (!due) break
      const [id, timer] = due
      this.time = timer.at
      if (timer.interval) timer.at += timer.interval
      else this.timers.delete(id)
      timer.callback()
    }
    this.time = target
  }
}

const artworks: Artwork[] = [
  { id: 'mona-lisa__leonardo-da-vinci', width: 2, height: 1, imagePath: '/mona.jpg' },
  { id: 'the-starry-night__vincent-van-gogh', width: 2, height: 1, imagePath: '/starry.jpg' },
  ...Array.from({ length: 99 }, (_, index) => ({ id: `art-${index}`, width: 2, height: 1, imagePath: `/art-${index}.jpg` })),
]

const flushPromises = () => new Promise<void>((resolve) => queueMicrotask(resolve))

function solvePractice(result: { current: ReturnType<typeof useGameSession> }) {
  const board = result.current.session?.board
  if (!board) throw new Error('Expected a board')
  // Use the public two-click operation to solve any board size.
  for (let index = 0; index < board.tiles.length; index += 1) {
    const position = result.current.session?.board.tiles.findIndex((tile) => tile.correctIndex === index) ?? -1
    if (position !== index) {
      act(() => result.current.clickTile(index))
      act(() => result.current.clickTile(position))
    }
  }
}

afterEach(() => vi.restoreAllMocks())

describe('useGameSession', () => {
  it('keeps preview non-interactive and starts timing only on the first tile click', async () => {
    const clock = new FakeClock()
    const { result } = renderHook(() => useGameSession({ artworks, clock, random: () => 0, loadImage: async () => undefined }))
    act(() => result.current.startGame())
    await act(flushPromises)
    expect(result.current.status).toBe('preview')
    act(() => { result.current.clickTile(0); clock.advanceBy(4000) })
    expect(result.current.status).toBe('preview')
    expect(result.current.session?.startedAtMs).toBeNull()
    expect(result.current.elapsedMs).toBe(0)
    act(() => clock.advanceBy(1000))
    expect(result.current.status).toBe('playing')
    expect(result.current.session?.startedAtMs).toBeNull()
    act(() => result.current.clickTile(0))
    act(() => clock.advanceBy(1234))
    expect(result.current.session?.startedAtMs).toBe(5000)
    expect(result.current.elapsedMs).toBe(1234)
  })

  it('allows startGame only from idle and rejects it in playing, fault, and completed', async () => {
    const clock = new FakeClock()
    const loadImage = vi.fn(async () => undefined)
    const { result } = renderHook(() => useGameSession({ artworks, clock, random: () => 0, loadImage }))

    act(() => result.current.startGame()); await act(flushPromises); act(() => clock.advanceBy(5000))
    expect(result.current.status).toBe('playing')
    const playingSession = result.current.session
    act(() => result.current.startGame())
    expect(result.current.status).toBe('playing')
    expect(result.current.session).toBe(playingSession)
    expect(loadImage).toHaveBeenCalledTimes(1)

    act(() => result.current.exitGame())
    expect(result.current.status).toBe('idle')
    act(() => result.current.startGame())
    await act(flushPromises)
    expect(result.current.status).toBe('preview')
    act(() => result.current.startGame())
    expect(result.current.status).toBe('preview')
    act(() => result.current.exitGame())

    const faultLoadImage = vi.fn(async () => { throw new Error('offline') })
    const fault = renderHook(() => useGameSession({ artworks, clock, retryDelayMs: () => 1, loadImage: faultLoadImage }))
    act(() => fault.result.current.startGame())
    for (let attempt = 1; attempt < 5; attempt += 1) {
      await act(flushPromises); act(() => clock.advanceBy(1))
    }
    await act(flushPromises)
    expect(fault.result.current.status).toBe('fault')
    const faultSession = fault.result.current.session
    act(() => fault.result.current.startGame())
    expect(fault.result.current.status).toBe('fault')
    expect(fault.result.current.session).toBe(faultSession)
    expect(faultLoadImage).toHaveBeenCalledTimes(5)
    act(() => fault.result.current.exitGame())

    const completed = renderHook(() => useGameSession({ artworks, clock, random: () => 0, loadImage: async () => undefined }))
    act(() => completed.result.current.startGame()); await act(flushPromises); act(() => clock.advanceBy(5000))
    solvePractice(completed.result)
    expect(completed.result.current.status).toBe('completed')
    const completedSession = completed.result.current.session
    act(() => completed.result.current.startGame())
    expect(completed.result.current.status).toBe('completed')
    expect(completed.result.current.session).toBe(completedSession)
    completed.unmount()
    fault.unmount()
  })

  it('switches stage after completion and preserves used artwork ids', async () => {
    const clock = new FakeClock()
    const { result } = renderHook(() => useGameSession({ artworks, clock, random: () => 0, loadImage: async () => undefined }))
    act(() => result.current.startGame()); await act(flushPromises); act(() => clock.advanceBy(5000))
    solvePractice(result)
    expect(result.current.status).toBe('completed')
    expect(result.current.session?.stage).toBe(1)
    act(() => result.current.nextStage()); await act(flushPromises)
    expect(result.current.status).toBe('preview')
    expect(result.current.session?.stage).toBe(2)
    expect(result.current.session?.usedArtworkIds.size).toBe(2)
  })

  it('exits and a newly mounted hook has no restored session', async () => {
    const clock = new FakeClock()
    const { result, unmount } = renderHook(() => useGameSession({ artworks, clock, loadImage: async () => undefined }))
    act(() => result.current.startGame()); await act(flushPromises)
    act(() => result.current.exitGame())
    expect(result.current).toMatchObject({ status: 'idle', session: null, elapsedMs: 0 })
    unmount()
    const fresh = renderHook(() => useGameSession({ artworks, clock, loadImage: async () => undefined }))
    expect(fresh.result.current.status).toBe('idle')
    fresh.unmount()
  })

  it('enters fault after exactly five consecutive load attempts and only permits exit', async () => {
    const clock = new FakeClock()
    const loadImage = vi.fn(async () => { throw new Error('offline') })
    const { result } = renderHook(() => useGameSession({ artworks, clock, loadImage, retryDelayMs: () => 1 }))
    act(() => result.current.startGame())
    for (let attempt = 1; attempt < 5; attempt += 1) {
      await act(flushPromises); act(() => clock.advanceBy(1))
    }
    await act(flushPromises)
    expect(loadImage).toHaveBeenCalledTimes(5)
    expect(result.current.status).toBe('fault')
    act(() => { result.current.clickTile(0); result.current.nextStage() })
    expect(result.current.status).toBe('fault')
    act(() => result.current.exitGame())
    expect(result.current.status).toBe('idle')
  })

  it('transitions stage 100 completion to final-completed', async () => {
    const clock = new FakeClock()
    const { result } = renderHook(() => useGameSession({ artworks, clock, random: () => 0, loadImage: async () => undefined }))
    act(() => result.current.startGame()); await act(flushPromises)
    // Move the in-memory session to the final state through the public flow.
    for (let stage = 1; stage <= 99; stage += 1) {
      act(() => clock.advanceBy(5000)); solvePractice(result)
      act(() => result.current.nextStage()); await act(flushPromises)
    }
    act(() => clock.advanceBy(5000)); solvePractice(result)
    expect(result.current.session?.stage).toBe(100)
    expect(result.current.status).toBe('final-completed')
    const finalSession = result.current.session
    act(() => result.current.startGame())
    expect(result.current.status).toBe('final-completed')
    expect(result.current.session).toBe(finalSession)
  })

  it('does not write game state to browser persistence APIs', async () => {
    const clock = new FakeClock()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const cookieSetter = vi.spyOn(Document.prototype, 'cookie', 'set')
    const indexedDbOpen = typeof window.indexedDB === 'undefined' ? undefined : vi.spyOn(window.indexedDB, 'open')
    const { result } = renderHook(() => useGameSession({ artworks, clock, loadImage: async () => undefined }))
    act(() => result.current.startGame()); await act(flushPromises)
    expect(setItem).not.toHaveBeenCalled()
    expect(cookieSetter).not.toHaveBeenCalled()
    if (indexedDbOpen) expect(indexedDbOpen).not.toHaveBeenCalled()
  })
})
