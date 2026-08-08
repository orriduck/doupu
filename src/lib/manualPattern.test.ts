import { describe, expect, it } from 'vitest'
import { createManualArtwork, drawLineCells, drawRectangleCells, EMPTY_CELL, floodFillCells, manualArtworkToPatternResult, patternResultToManualArtwork, setArtworkCell, updateArtworkCells } from './manualPattern'

describe('manual artwork tools', () => {
  it('draws a diagonal line with one cell per step', () => {
    const artwork = createManualArtwork(5, 5)
    const cells = drawLineCells(artwork.cells, 5, 5, 0, 0, 4, 4, 7)
    expect(Array.from(cells).filter((value) => value === 7)).toHaveLength(5)
    expect([0, 6, 12, 18, 24].map((index) => cells[index])).toEqual([7, 7, 7, 7, 7])
  })

  it('fills a rectangular region', () => {
    const artwork = createManualArtwork(5, 5)
    const cells = drawRectangleCells(artwork.cells, 5, 5, 1, 1, 3, 2, 4)
    expect(Array.from(cells).filter((value) => value === 4)).toHaveLength(6)
  })

  it('flood fills only the connected area', () => {
    const artwork = createManualArtwork(4, 3)
    let cells = artwork.cells
    cells = setArtworkCell(cells, 4, 3, 1, 0, 2)
    cells = setArtworkCell(cells, 4, 3, 1, 1, 2)
    cells = setArtworkCell(cells, 4, 3, 1, 2, 2)
    cells = floodFillCells(cells, 4, 3, 0, 0, 5)
    expect(Array.from(cells).filter((value) => value === 5)).toHaveLength(3)
    expect(cells[2]).toBe(EMPTY_CELL)
  })

  it('round trips through the shared export result without changing codes', () => {
    let artwork = createManualArtwork(52, 52, 'mard-221')
    artwork = updateArtworkCells(artwork, setArtworkCell(artwork.cells, 52, 52, 10, 12, 42))
    const result = manualArtworkToPatternResult(artwork)
    const restored = patternResultToManualArtwork(result, 'mard-221')
    expect(result.totalBeads).toBe(1)
    expect(restored.cells[12 * 52 + 10]).toBe(42)
  })
})
