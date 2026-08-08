import { describe, expect, it } from 'vitest'
import { BOARD_PRESETS } from './boards'

describe('finished-size presets', () => {
  it('offers the specified small, standard and large square sizes', () => {
    expect(BOARD_PRESETS.map(({ value, columns, rows }) => ({ value, columns, rows }))).toEqual([
      { value: '52x52', columns: 52, rows: 52 },
      { value: '74x74', columns: 74, rows: 74 },
      { value: '104x104', columns: 104, rows: 104 },
    ])
  })
})
