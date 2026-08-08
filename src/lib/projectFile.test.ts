import { describe, expect, it } from 'vitest'
import { createManualArtwork, EMPTY_CELL } from './manualPattern'
import { decodeArtwork, encodeArtwork } from './projectFile'

describe('doupu project board encoding', () => {
  it('round trips cells through the code dictionary and rle encoding', () => {
    const artwork = createManualArtwork(52, 52, 'mard-221')
    artwork.cells.fill(12, 50, 80)
    artwork.cells.fill(65, 800, 850)
    const encoded = encodeArtwork(artwork)
    const restored = decodeArtwork({
      columns: 52,
      rows: 52,
      paletteId: 'mard-221',
      cells: encoded,
    })
    expect(Array.from(restored.cells)).toEqual(Array.from(artwork.cells))
    expect(encoded.runs.length).toBeLessThan(artwork.cells.length)
    expect(restored.cells[0]).toBe(EMPTY_CELL)
  })
})
