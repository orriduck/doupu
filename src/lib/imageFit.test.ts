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

  it('moves a covered image using the chosen focal position', () => {
    expect(getImageDrawRect(200, 100, 100, 100, 'cover', { x: 0, y: 0.5, zoom: 1 })).toMatchObject({ x: 0, y: 0, width: 200, height: 100 })
    expect(getImageDrawRect(200, 100, 100, 100, 'cover', { x: 1, y: 0.5, zoom: 1 })).toMatchObject({ x: -100, y: 0, width: 200, height: 100 })
  })

  it('zooms around the chosen focal position', () => {
    expect(getImageDrawRect(200, 100, 100, 100, 'cover', { x: 0.5, y: 0.5, zoom: 2 })).toMatchObject({ x: -150, y: -50, width: 400, height: 200 })
  })
})
