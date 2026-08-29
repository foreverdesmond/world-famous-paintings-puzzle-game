import manifestCsv from '../assets/paintings/manifest.csv?raw'
import { ARTWORK_TRANSLATIONS } from './artworkTranslations'
import { ARTWORK_DIMENSIONS } from './artworkDimensions'

export const UNKNOWN_DATE = '年代未知'

/** The only artwork shape allowed to cross into game/UI code. */
export interface Artwork {
  id: string
  title: string
  titleZh: string
  artist: string
  artistZh: string
  date: string
  imagePath: string
  width: number
  height: number
}

/** Resource-maintenance data stays outside Artwork and is never a UI model. */
export interface ArtworkMaintenanceRecord {
  artwork: Artwork
  sourceProvider: string
  sourceUrl: string
  imageUrl: string
  licence: string
}

export interface ArtworkTranslation {
  titleZh: string
  artistZh: string
  date?: string
}

export interface ArtworkDimensions {
  width: number
  height: number
}

type ManifestRow = {
  title: string
  artist: string
  institution: string
  licence: string
  page_url: string
  image_url: string
  file: string
}

export const artworkCatalog: readonly Artwork[] = loadArtworkCatalog(
  manifestCsv,
  ARTWORK_DIMENSIONS,
  ARTWORK_TRANSLATIONS,
)

export function loadArtworkCatalog(
  csv: string,
  dimensions: Readonly<Record<string, ArtworkDimensions>>,
  translations: Readonly<Record<string, ArtworkTranslation>>,
): readonly Artwork[] {
  const rows = parseCsv(csv)
  const ids = new Set<string>()
  const catalog = rows.map((row) => {
    const id = deriveArtworkId(row.file)
    if (ids.has(id)) throw new Error(`Duplicate artwork id: ${id}`)
    ids.add(id)

    const translation = translations[id]
    if (!translation?.titleZh.trim() || !translation.artistZh.trim()) {
      throw new Error(`Missing Chinese translation: ${id}`)
    }
    const size = dimensions[id]
    if (!size || !Number.isInteger(size.width) || !Number.isInteger(size.height) || size.width <= 0 || size.height <= 0) {
      throw new Error(`Missing or invalid image dimensions: ${id}`)
    }
    const imagePath = `/assets/paintings/${row.file.split('/').pop()}`
    if (!imagePath || !imagePath.endsWith('.jpg')) throw new Error(`Invalid local image path: ${id}`)

    return {
      id,
      title: row.title,
      titleZh: translation.titleZh,
      artist: row.artist,
      artistZh: translation.artistZh,
      date: translation.date?.trim() || UNKNOWN_DATE,
      imagePath,
      width: size.width,
      height: size.height,
    }
  })

  if (catalog.length < 100) throw new Error(`At least 100 artworks are required, got ${catalog.length}`)
  return catalog
}

export function loadMaintenanceRecords(csv: string): readonly ArtworkMaintenanceRecord[] {
  const rows = parseCsv(csv)
  return rows.map((row) => {
    const artwork = artworkCatalog.find((item) => item.id === deriveArtworkId(row.file))
    if (!artwork) throw new Error(`No artwork for maintenance record: ${row.file}`)
    return {
      artwork,
      sourceProvider: row.institution,
      sourceUrl: row.page_url,
      imageUrl: row.image_url,
      licence: row.licence,
    }
  })
}

export function deriveArtworkId(file: string): string {
  const name = file.split('/').pop() ?? ''
  return name.replace(/\.[^.]+$/, '')
}

function parseCsv(csv: string): ManifestRow[] {
  const records = csv.trim().split(/\r?\n/).map(parseCsvLine)
  const header = records.shift()
  if (!header || header.join(',') !== 'title,artist,institution,licence,page_url,image_url,file,jpeg_bytes') {
    throw new Error('Unexpected paintings manifest header')
  }
  return records.map((values) => {
    if (values.length !== 8) throw new Error('Malformed paintings manifest row')
    const [title, artist, institution, licence, page_url, image_url, file] = values
    return { title, artist, institution, licence, page_url, image_url, file }
  })
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let value = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const character = line[i]
    if (character === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i += 1 } else quoted = !quoted
    } else if (character === ',' && !quoted) { values.push(value); value = '' } else value += character
  }
  values.push(value)
  return values
}
