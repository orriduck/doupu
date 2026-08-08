import { describe, expect, it } from 'vitest'
import type { PatternResult } from '../types'
import { getOccupiedBounds } from './patternBounds'

function resultWithCells(cells: number[], columns = 4, rows = 4): PatternResult {
  return {
    columns,
    rows,
    cells: new Uint16Array(cells),
    palette: [],
    counts: [],
    totalBeads: cells.filter((cell) => cell !== 65535).length,
  }
}

describe('occupied pattern bounds', () => {
  it('removes empty rows and columns while preserving the original offset', () => {
    const empty = 65535
    const result = resultWithCells([
      empty, empty, empty, empty,
      empty, 0, 0, empty,
      empty, 0, 0, empty,
      empty, empty, empty, empty,
    ])
    expect(getOccupiedBounds(result)).toEqual({
      startColumn: 1,
      startRow: 1,
      endColumn: 3,
      endRow: 3,
      columns: 2,
      rows: 2,
    })
  })

  it('keeps the full board when every cell is used', () => {
    expect(getOccupiedBounds(resultWithCells(new Array(16).fill(0)))).toEqual({
      startColumn: 0,
      startRow: 0,
      endColumn: 4,
      endRow: 4,
      columns: 4,
      rows: 4,
    })
  })
})
