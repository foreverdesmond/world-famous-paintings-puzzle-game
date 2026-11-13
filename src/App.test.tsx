import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('application shell', () => {
  it('renders the logo and project title on the landing page', () => {
    render(<App />)
    const logo = screen.getByTestId('logo')
    expect(logo.tagName).toBe('IMG')
    expect(logo).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '世界名画拼图小游戏' })).toBeInTheDocument()
  })
})
