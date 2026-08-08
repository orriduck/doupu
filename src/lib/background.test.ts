import { describe, expect, it } from 'vitest'
import { createVisibilityMask } from './background'

function image(columns: number, rows: number, background: [number, number, number]) {
  const pixels = new Uint8ClampedArray(columns * rows * 4)
  for (let cell = 0; cell < columns * rows; cell += 1) {
    pixels.set([...background, 255], cell * 4)
  }
  return pixels
}

function paint(pixels: Uint8ClampedArray, columns: number, column: number, row: number, color: [number, number, number]) {
  pixels.set([...color, 255], (row * columns + column) * 4)
}

describe('createVisibilityMask', () => {
  it('keeps every opaque pixel when background removal is disabled', () => {
    const pixels = image(6, 6, [238, 235, 226])
    expect(Array.from(createVisibilityMask(pixels, 6, 6, 'keep', 16))).toEqual(new Array(36).fill(1))
  })

  it('removes the dominant edge background but preserves the foreground', () => {
    const pixels = image(8, 8, [232, 235, 231])
    for (let row = 2; row < 6; row += 1) {
      for (let column = 2; column < 6; column += 1) paint(pixels, 8, column, row, [148, 48, 38])
    }
    const mask = createVisibilityMask(pixels, 8, 8, 'edge', 14)
    expect(mask.reduce((sum, value) => sum + value, 0)).toBe(16)
    expect(mask[3 * 8 + 3]).toBe(1)
    expect(mask[0]).toBe(0)
  })

  it('also removes isolated areas that match the edge background', () => {
    const pixels = image(9, 9, [230, 233, 229])
    for (let row = 2; row < 7; row += 1) {
      for (let column = 2; column < 7; column += 1) paint(pixels, 9, column, row, [118, 62, 44])
    }
    paint(pixels, 9, 4, 4, [227, 231, 228])
    const mask = createVisibilityMask(pixels, 9, 9, 'edge', 15)
    expect(mask[4 * 9 + 4]).toBe(0)
    expect(mask[3 * 9 + 4]).toBe(1)
  })

  it('always preserves transparency as an unused cell', () => {
    const pixels = image(4, 4, [20, 20, 20])
    pixels[3] = 0
    expect(createVisibilityMask(pixels, 4, 4, 'keep', 16)[0]).toBe(0)
  })
})
