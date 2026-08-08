import { describe, expect, it } from 'vitest'
import { HAMA_MIDI_PALETTE } from './hamaPalette'
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

  it('uses material codes as chart symbols', () => {
    expect(STUDIO_PALETTE.every((color) => color.symbol === color.code)).toBe(true)
  })
})

describe('Hama Midi palette', () => {
  it('keeps official material-number conventions selectable', () => {
    expect(HAMA_MIDI_PALETTE.length).toBeGreaterThan(70)
    expect(HAMA_MIDI_PALETTE.find((color) => color.code === '01')).toMatchObject({ brand: 'Hama', name: '白' })
    expect(HAMA_MIDI_PALETTE.find((color) => color.code === '18')).toMatchObject({ brand: 'Hama', name: '黑' })
  })

  it('uses material codes as chart symbols', () => {
    expect(HAMA_MIDI_PALETTE.every((color) => color.symbol === color.code)).toBe(true)
  })
})
