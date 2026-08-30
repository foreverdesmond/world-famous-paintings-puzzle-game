import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResultDialog } from './ResultDialog'

afterEach(cleanup)

describe('ResultDialog', () => {
  it('offers next stage and exit for an ordinary completion', () => {
    const onNextStage = vi.fn()
    const onExit = vi.fn()
    render(<ResultDialog status="completed" elapsedMs={1234} onNextStage={onNextStage} onExit={onExit} />)

    expect(screen.getByRole('heading', { name: '本关通关' })).toBeInTheDocument()
    expect(screen.getByText('1秒')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '下一关' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '退出游戏' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /重开|重打乱/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '下一关' }))
    fireEvent.click(screen.getByRole('button', { name: '退出游戏' }))
    expect(onNextStage).toHaveBeenCalledOnce()
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('only offers exit after final completion', () => {
    render(<ResultDialog status="final-completed" elapsedMs={5000} onExit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: '恭喜完成全部关卡' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '下一关' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '退出游戏' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /重开|重打乱/ })).not.toBeInTheDocument()
  })

  it('only offers exit after a loading fault', () => {
    render(<ResultDialog status="fault" onExit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: '游戏故障' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '退出游戏' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '下一关' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /重开|重打乱/ })).not.toBeInTheDocument()
  })
})
