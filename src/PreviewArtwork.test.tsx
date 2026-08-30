import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PreviewArtwork } from './PreviewArtwork'

const artwork = { id: 'demo', title: 'Demo', titleZh: '示例', artist: 'Artist', artistZh: '作者', date: '1900', imagePath: '/demo.jpg', width: 1200, height: 800 }

describe('PreviewArtwork', () => {
  it('renders only the complete source image, with no puzzle tile controls', () => {
    render(<PreviewArtwork artwork={artwork} />)
    expect(screen.getByTestId('preview-image')).toHaveAttribute('src', '/demo.jpg')
    expect(screen.getByRole('img', { name: '示例完整原图预览' })).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
