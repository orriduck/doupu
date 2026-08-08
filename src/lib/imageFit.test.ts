import { describe, expect, it } from 'vitest'
import { getImageDrawRect } from './imageFit'

describe('image fitting', () => {
  it('crops a portrait image to fill a square board', () => {
    const result = getImageDrawRect(100, 200, 58, 58, 'cover')
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(-29)
    expect(result.width).toBeCloseTo(58)
    expect(result.height).toBeCloseTo(116)
  })

  it('scales a portrait image inside a square board without cropping', () => {
    const result = getImageDrawRect(100, 200, 58, 58, 'contain')
    expect(result.x).toBeCloseTo(14.5)
    expect(result.y).toBeCloseTo(0)
    expect(result.width).toBeCloseTo(29)
    expect(result.height).toBeCloseTo(58)
  })
})
