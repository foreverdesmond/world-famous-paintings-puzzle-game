import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('application shell', () => {
  it('renders the project title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '世界名画拼图小游戏' })).toBeInTheDocument()
  })
})
