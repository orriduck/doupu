/// <reference lib="webworker" />

import { deltaE2000, hexToRgb, rgbToLab } from '../lib/color'
import type { BeadColor } from '../types'

interface PatternRequest {
  id: number
  pixels: ArrayBuffer
  columns: number
  rows: number
  maxColors: number
  dither: number
  removeWhite: boolean
  palette: BeadColor[]
}

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = (event: MessageEvent<PatternRequest>) => {
  const { id, pixels, columns, rows, maxColors, dither, removeWhite, palette } = event.data
  const source = new Uint8ClampedArray(pixels)
  const paletteRgb = palette.map((color) => hexToRgb(color.hex))
  const paletteLab = paletteRgb.map(([r, g, b]) => rgbToLab(r, g, b))
  const usage = new Uint32Array(palette.length)
  const visible = new Uint8Array(columns * rows)

  const nearestFrom = (r: number, g: number, b: number, indexes: number[]) => {
    const lab = rgbToLab(r, g, b)
    let best = indexes[0]
    let bestDistance = Number.POSITIVE_INFINITY
    for (const index of indexes) {
      const distance = deltaE2000(lab, paletteLab[index])
      if (distance < bestDistance) {
        bestDistance = distance
        best = index
      }
    }
    return best
  }

  const allIndexes = palette.map((_, index) => index)
  for (let cell = 0; cell < columns * rows; cell += 1) {
    const pixel = cell * 4
    const r = source[pixel]
    const g = source[pixel + 1]
    const b = source[pixel + 2]
    const alpha = source[pixel + 3]
    // Generated artwork and phone photos often use a warm paper white rather
    // than pure RGB white. Keep the heuristic intentionally conservative, but
    // include ivory backgrounds so the "去白底" control has practical value.
    const isPaper = removeWhite
      && alpha > 16
      && r > 222
      && g > 216
      && b > 202
      && Math.max(r, g, b) - Math.min(r, g, b) < 34
    if (alpha < 64 || isPaper) continue
    visible[cell] = 1
    usage[nearestFrom(r, g, b, allIndexes)] += 1
  }

  let selectedIndexes = allIndexes
    .filter((index) => usage[index] > 0)
    .sort((a, b) => usage[b] - usage[a])
    .slice(0, Math.max(2, Math.min(maxColors, palette.length)))
  if (selectedIndexes.length === 0) selectedIndexes = [0, palette.length - 1]

  const activePalette = selectedIndexes.map((index) => palette[index])
  const activeRgb = selectedIndexes.map((index) => paletteRgb[index])
  const activeLabs = selectedIndexes.map((index) => paletteLab[index])
  const cells = new Uint16Array(columns * rows)
  cells.fill(65535)
  const counts = new Uint32Array(activePalette.length)
  const work = new Float32Array(columns * rows * 3)
  for (let cell = 0; cell < columns * rows; cell += 1) {
    const pixel = cell * 4
    const workIndex = cell * 3
    work[workIndex] = source[pixel]
    work[workIndex + 1] = source[pixel + 1]
    work[workIndex + 2] = source[pixel + 2]
  }

  const strength = Math.max(0, Math.min(1, dither))
  const spread = (x: number, y: number, error: [number, number, number], factor: number) => {
    if (x < 0 || x >= columns || y < 0 || y >= rows) return
    const index = (y * columns + x) * 3
    work[index] += error[0] * factor * strength
    work[index + 1] += error[1] * factor * strength
    work[index + 2] += error[2] * factor * strength
  }

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const cell = y * columns + x
      if (!visible[cell]) continue
      const workIndex = cell * 3
      const r = Math.max(0, Math.min(255, work[workIndex]))
      const g = Math.max(0, Math.min(255, work[workIndex + 1]))
      const b = Math.max(0, Math.min(255, work[workIndex + 2]))
      const lab = rgbToLab(r, g, b)
      let match = 0
      let distance = Number.POSITIVE_INFINITY
      for (let index = 0; index < activeLabs.length; index += 1) {
        const current = deltaE2000(lab, activeLabs[index])
        if (current < distance) {
          distance = current
          match = index
        }
      }
      cells[cell] = match
      counts[match] += 1
      if (strength > 0) {
        const target = activeRgb[match]
        const error: [number, number, number] = [r - target[0], g - target[1], b - target[2]]
        spread(x + 1, y, error, 7 / 16)
        spread(x - 1, y + 1, error, 3 / 16)
        spread(x, y + 1, error, 5 / 16)
        spread(x + 1, y + 1, error, 1 / 16)
      }
    }
  }

  const totalBeads = counts.reduce((sum, count) => sum + count, 0)
  ctx.postMessage({
    id,
    columns,
    rows,
    cells: cells.buffer,
    palette: activePalette,
    counts: Array.from(counts),
    totalBeads,
  }, [cells.buffer])
}

export {}
