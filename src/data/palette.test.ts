import { describe, expect, it } from 'vitest'
import { STUDIO_PALETTE } from './palette'

describe('MARD 221 palette', () => {
  it('contains all standard A-H/M material codes', () => {
    expect(STUDIO_PALETTE).toHaveLength(221)
    expect(new Set(STUDIO_PALETTE.map((color) => color.code)).size).toBe(221)
  })

  it('uses the expected neutral material numbers', () => {
    expect(STUDIO_PALETTE.find((color) => color.code === 'H2')).toMatchObject({ brand: 'MARD', name: '白色', hex: '#FEFFFF' })
    expect(STUDIO_PALETTE.find((color) => color.code === 'H7')).toMatchObject({ brand: 'MARD', name: '黑色', hex: '#000000' })
  })
})
