import { describe, expect, it } from 'vitest'
import {
  UNKNOWN_DATE,
  artworkCatalog,
  deriveArtworkId,
  loadArtworkCatalog,
  loadMaintenanceRecords,
} from './artworkCatalog'
import { ARTWORK_DIMENSIONS } from './artworkDimensions'
import { ARTWORK_TRANSLATIONS } from './artworkTranslations'

describe('artworkCatalog', () => {
  it('loads the real manifest into 101 unique artwork records', () => {
    expect(artworkCatalog).toHaveLength(101)
    expect(new Set(artworkCatalog.map((artwork) => artwork.id)).size).toBe(101)
    expect(artworkCatalog.every((artwork) => artwork.imagePath.startsWith('/assets/paintings/'))).toBe(true)
  })

  it('contains both fixed practice images as local resources', () => {
    expect(artworkCatalog.find(({ id }) => id === 'mona-lisa__leonardo-da-vinci')?.imagePath).toBe(
      '/assets/paintings/mona-lisa__leonardo-da-vinci.jpg',
    )
    expect(artworkCatalog.find(({ id }) => id === 'the-starry-night__vincent-van-gogh')?.imagePath).toBe(
      '/assets/paintings/the-starry-night__vincent-van-gogh.jpg',
    )
  })

  it('derives positive dimensions and orientation inputs from every local image', () => {
    expect(artworkCatalog.every(({ width, height }) => width > 0 && height > 0)).toBe(true)
    expect(artworkCatalog.find(({ id }) => id === 'mona-lisa__leonardo-da-vinci')).toMatchObject({ width: 1920, height: 2861 })
    expect(artworkCatalog.find(({ id }) => id === 'the-starry-night__vincent-van-gogh')).toMatchObject({ width: 1879, height: 1500 })
  })

  it('merges complete bilingual labels and falls back missing dates', () => {
    expect(artworkCatalog.every(({ titleZh, artistZh }) => titleZh.length > 0 && artistZh.length > 0)).toBe(true)
    expect(artworkCatalog.find(({ id }) => id === 'mona-lisa__leonardo-da-vinci')).toMatchObject({
      titleZh: '蒙娜丽莎',
      artistZh: '列奥纳多·达·芬奇',
      date: UNKNOWN_DATE,
    })
  })

  it('validates duplicate ids, missing mappings, paths, and dimensions', () => {
    const csv = 'title,artist,institution,licence,page_url,image_url,file,jpeg_bytes\nA,B,C,D,E,F,assets/paintings/a.jpg,1'
    expect(() => loadArtworkCatalog(`${csv}\n${csv.split('\n')[1]}`, { a: { width: 1, height: 1 } }, { a: { titleZh: '甲', artistZh: '乙' } })).toThrow('Duplicate artwork id')
    expect(() => loadArtworkCatalog(csv, { a: { width: 1, height: 1 } }, {})).toThrow('Missing Chinese translation')
    expect(() => loadArtworkCatalog(csv, {}, { a: { titleZh: '甲', artistZh: '乙' } })).toThrow('dimensions')
  })

  it('keeps sourceProvider, URLs, and licence in maintenance records only', () => {
    const maintenance = loadMaintenanceRecords('title,artist,institution,licence,page_url,image_url,file,jpeg_bytes\nMona Lisa,Leonardo da Vinci,Wikimedia Commons,Public domain,page,image,assets/paintings/mona-lisa__leonardo-da-vinci.jpg,1')
    expect(maintenance[0]).toMatchObject({ sourceProvider: 'Wikimedia Commons', licence: 'Public domain' })
    const uiModel = maintenance[0].artwork
    expect(Object.keys(uiModel)).not.toEqual(expect.arrayContaining(['sourceProvider', 'sourceUrl', 'imageUrl', 'licence', 'institution']))
  })

  it('uses the filename without extension as a stable id', () => {
    expect(deriveArtworkId('assets/paintings/a-work__an-artist.jpg')).toBe('a-work__an-artist')
  })

  it('keeps the versioned mapping and measured dimensions aligned with the manifest', () => {
    expect(Object.keys(ARTWORK_TRANSLATIONS)).toHaveLength(101)
    expect(Object.keys(ARTWORK_DIMENSIONS)).toHaveLength(101)
    expect(artworkCatalog.map(({ id }) => id)).toEqual(Object.keys(ARTWORK_TRANSLATIONS))
  })
})
