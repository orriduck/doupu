import { describe, expect, it } from 'vitest'
import { BOARD_PRESETS } from './boards'

describe('physical board presets', () => {
  it('uses only 29 × 29 interlocking board modules', () => {
    expect(BOARD_PRESETS).toHaveLength(7)
    for (const preset of BOARD_PRESETS) {
      expect(preset.columns % 29).toBe(0)
      expect(preset.rows % 29).toBe(0)
    }
  })
})
