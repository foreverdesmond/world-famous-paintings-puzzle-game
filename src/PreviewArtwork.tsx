import type { Artwork } from './artworkCatalog'

export function PreviewArtwork({ artwork }: { artwork: Artwork }) {
  return <img className="preview-image" data-testid="preview-image" src={artwork.imagePath} alt={`${artwork.titleZh}完整原图预览`} style={{ objectFit: 'contain' }} />
}
