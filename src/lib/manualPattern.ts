import { getPalette } from '../data/palettes'
import { deltaE2000, hexToRgb, rgbToLab } from './color'
import type { ManualArtwork, PaletteId, PatternResult } from '../types'

export const EMPTY_CELL = 65535

export function createManualArtwork(columns = 74, rows = 74, paletteId: PaletteId = 'mard-221'): ManualArtwork {
  const cells = new Uint16Array(columns * rows)
  cells.fill(EMPTY_CELL)
  return { columns, rows, paletteId, cells }
}

export function updateArtworkCells(artwork: ManualArtwork, cells: Uint16Array): ManualArtwork {
  return { ...artwork, cells }
}

export function resizeArtwork(artwork: ManualArtwork, columns: number, rows: number): ManualArtwork {
  if (columns === artwork.columns && rows === artwork.rows) return artwork
  const next = createManualArtwork(columns, rows, artwork.paletteId)
  const copyColumns = Math.min(columns, artwork.columns)
  const copyRows = Math.min(rows, artwork.rows)
  const sourceX = Math.floor((artwork.columns - copyColumns) / 2)
  const sourceY = Math.floor((artwork.rows - copyRows) / 2)
  const targetX = Math.floor((columns - copyColumns) / 2)
  const targetY = Math.floor((rows - copyRows) / 2)
  for (let row = 0; row < copyRows; row += 1) {
    for (let column = 0; column < copyColumns; column += 1) {
      next.cells[(row + targetY) * columns + column + targetX] = artwork.cells[(row + sourceY) * artwork.columns + column + sourceX]
    }
  }
  return next
}

export function remapArtworkPalette(artwork: ManualArtwork, paletteId: PaletteId): ManualArtwork {
  if (artwork.paletteId === paletteId) return artwork
  const sourcePalette = getPalette(artwork.paletteId)
  const targetPalette = getPalette(paletteId)
  const targetLabs = targetPalette.map((color) => {
    const [r, g, b] = hexToRgb(color.hex)
    return rgbToLab(r, g, b)
  })
  const mapping = sourcePalette.map((color) => {
    const [r, g, b] = hexToRgb(color.hex)
    const lab = rgbToLab(r, g, b)
    let best = 0
    let distance = Number.POSITIVE_INFINITY
    targetLabs.forEach((target, index) => {
      const next = deltaE2000(lab, target)
      if (next < distance) {
        best = index
        distance = next
      }
    })
    return best
  })
  const cells = new Uint16Array(artwork.cells.length)
  cells.fill(EMPTY_CELL)
  artwork.cells.forEach((value, index) => {
    if (value !== EMPTY_CELL) cells[index] = mapping[value] ?? EMPTY_CELL
  })
  return { ...artwork, paletteId, cells }
}

export function setArtworkCell(cells: Uint16Array, columns: number, rows: number, column: number, row: number, value: number) {
  if (column < 0 || column >= columns || row < 0 || row >= rows) return cells
  const index = row * columns + column
  if (cells[index] === value) return cells
  const next = cells.slice()
  next[index] = value
  return next
}

export function drawLineCells(cells: Uint16Array, columns: number, rows: number, startColumn: number, startRow: number, endColumn: number, endRow: number, value: number) {
  const next = cells.slice()
  let x = startColumn
  let y = startRow
  const dx = Math.abs(endColumn - startColumn)
  const sx = startColumn < endColumn ? 1 : -1
  const dy = -Math.abs(endRow - startRow)
  const sy = startRow < endRow ? 1 : -1
  let error = dx + dy
  while (true) {
    if (x >= 0 && x < columns && y >= 0 && y < rows) next[y * columns + x] = value
    if (x === endColumn && y === endRow) break
    const doubleError = error * 2
    if (doubleError >= dy) { error += dy; x += sx }
    if (doubleError <= dx) { error += dx; y += sy }
  }
  return next
}

export function drawRectangleCells(cells: Uint16Array, columns: number, rows: number, startColumn: number, startRow: number, endColumn: number, endRow: number, value: number) {
  const next = cells.slice()
  const left = Math.max(0, Math.min(startColumn, endColumn))
  const right = Math.min(columns - 1, Math.max(startColumn, endColumn))
  const top = Math.max(0, Math.min(startRow, endRow))
  const bottom = Math.min(rows - 1, Math.max(startRow, endRow))
  for (let row = top; row <= bottom; row += 1) {
    for (let column = left; column <= right; column += 1) next[row * columns + column] = value
  }
  return next
}

export function floodFillCells(cells: Uint16Array, columns: number, rows: number, column: number, row: number, value: number) {
  if (column < 0 || column >= columns || row < 0 || row >= rows) return cells
  const target = cells[row * columns + column]
  if (target === value) return cells
  const next = cells.slice()
  const queue = [row * columns + column]
  next[queue[0]] = value
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor]
    const x = index % columns
    const y = Math.floor(index / columns)
    const neighbors = [
      x > 0 ? index - 1 : -1,
      x < columns - 1 ? index + 1 : -1,
      y > 0 ? index - columns : -1,
      y < rows - 1 ? index + columns : -1,
    ]
    neighbors.forEach((neighbor) => {
      if (neighbor >= 0 && next[neighbor] === target) {
        next[neighbor] = value
        queue.push(neighbor)
      }
    })
  }
  return next
}

export function manualArtworkToPatternResult(artwork: ManualArtwork): PatternResult {
  const sourcePalette = getPalette(artwork.paletteId)
  const used = Array.from(new Set(Array.from(artwork.cells).filter((value) => value !== EMPTY_CELL))).sort((a, b) => a - b)
  const compactIndex = new Map(used.map((sourceIndex, index) => [sourceIndex, index]))
  const cells = new Uint16Array(artwork.cells.length)
  cells.fill(EMPTY_CELL)
  const counts = new Array(used.length).fill(0)
  let totalBeads = 0
  artwork.cells.forEach((value, index) => {
    if (value === EMPTY_CELL) return
    const mapped = compactIndex.get(value)
    if (mapped == null) return
    cells[index] = mapped
    counts[mapped] += 1
    totalBeads += 1
  })
  return {
    columns: artwork.columns,
    rows: artwork.rows,
    cells,
    palette: used.map((index) => sourcePalette[index]),
    counts,
    totalBeads,
  }
}

export function patternResultToManualArtwork(result: PatternResult, paletteId: PaletteId): ManualArtwork {
  const palette = getPalette(paletteId)
  const lookup = new Map(palette.map((color, index) => [`${color.brand}:${color.code}`, index]))
  const cells = new Uint16Array(result.cells.length)
  cells.fill(EMPTY_CELL)
  result.cells.forEach((value, index) => {
    if (value === EMPTY_CELL) return
    const color = result.palette[value]
    const target = color ? lookup.get(`${color.brand}:${color.code}`) : undefined
    if (target != null) cells[index] = target
  })
  return { columns: result.columns, rows: result.rows, paletteId, cells }
}
