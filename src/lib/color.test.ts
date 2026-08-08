import { describe, expect, it } from 'vitest'
import { deltaE2000, rgbToLab } from './color'

describe('color conversion', () => {
  it('maps white and black to the expected CIELAB lightness endpoints', () => {
    expect(rgbToLab(255, 255, 255).l).toBeCloseTo(100, 4)
    expect(rgbToLab(0, 0, 0).l).toBeCloseTo(0, 4)
  })

  it('matches the published CIEDE2000 Sharma reference pair', () => {
    const value = deltaE2000(
      { l: 50, a: 2.6772, b: -79.7751 },
      { l: 50, a: 0, b: -82.7485 },
    )
    expect(value).toBeCloseTo(2.0425, 4)
  })
})
