import type { PatternResult } from '../types'

export interface PatternBounds {
  startColumn: number
  startRow: number
  endColumn: number
  endRow: number
  columns: number
  rows: number
}

export function getOccupiedBounds(result: PatternResult): PatternBounds {
  let startColumn = result.columns
  let startRow = result.rows
  let endColumn = 0
  let endRow = 0

  for (let row = 0; row < result.rows; row += 1) {
    for (let column = 0; column < result.columns; column += 1) {
      if (result.cells[row * result.columns + column] === 65535) continue
      startColumn = Math.min(startColumn, column)
      startRow = Math.min(startRow, row)
      endColumn = Math.max(endColumn, column + 1)
      endRow = Math.max(endRow, row + 1)
    }
  }

  if (endColumn <= startColumn || endRow <= startRow) {
    return {
      startColumn: 0,
      startRow: 0,
      endColumn: result.columns,
      endRow: result.rows,
      columns: result.columns,
      rows: result.rows,
    }
  }

  return {
    startColumn,
    startRow,
    endColumn,
    endRow,
    columns: endColumn - startColumn,
    rows: endRow - startRow,
  }
}
