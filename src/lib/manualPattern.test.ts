import { describe, expect, it } from 'vitest'
import { createManualArtwork, drawBrushStrokeCells, drawLineCells, drawRectangleCells, EMPTY_CELL, floodFillCells, manualArtworkToPatternResult, patternResultToManualArtwork, setArtworkCell, updateArtworkCells } from './manualPattern'

describe('manual artwork tools', () => {
  it('draws a continuous multi-cell brush stroke and clips it to the board', () => {
    const artwork = createManualArtwork(7, 7)
    const cells = drawBrushStrokeCells(artwork.cells, 7, 7, 0, 0, 4, 0, 3, 8)
    expect(Array.from(cells).filter((value) => value === 8)).toHaveLength(12)
    expect([0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12].map((index) => cells[index])).toEqual(new Array(12).fill(8))
  })

  it('uses the same brush size to erase a painted area', () => {
    const painted = new Uint16Array(25)
    painted.fill(4)
    const cells = drawBrushStrokeCells(painted, 5, 5, 2, 2, 2, 2, 3, EMPTY_CELL)
    expect(Array.from(cells).filter((value) => value === EMPTY_CELL)).toHaveLength(9)
  })

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
