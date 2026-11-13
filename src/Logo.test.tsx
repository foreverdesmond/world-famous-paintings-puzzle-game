import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Logo } from './Logo'
import logoUrl from './assets/logo.svg'

describe('Logo', () => {
  afterEach(cleanup)

  it('renders the logo image at the default 40px size', () => {
    render(<Logo />)
    const image = screen.getByTestId('logo')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', logoUrl)
    expect(image).toHaveAttribute('width', '40')
    expect(image).toHaveAttribute('height', '40')
  })

  it('uses the requested size for width and height', () => {
    render(<Logo size={64} />)
    const image = screen.getByTestId('logo')
    expect(image).toHaveAttribute('width', '64')
    expect(image).toHaveAttribute('height', '64')
  })

  it('is decorative: empty alt and hidden from assistive technology', () => {
    render(<Logo />)
    const image = screen.getByTestId('logo')
    expect(image).toHaveAttribute('alt', '')
    expect(image).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
