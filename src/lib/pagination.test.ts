import { describe, expect, it } from 'vitest'
import { createOverlappingSlices } from './pagination'

describe('createOverlappingSlices', () => {
  it('creates two-column overlaps for a 104-column chart', () => {
    expect(createOverlappingSlices(0, 104, 42, 2)).toEqual([
      { start: 0, end: 42, overlapBefore: 0, overlapAfter: 2 },
      { start: 40, end: 82, overlapBefore: 2, overlapAfter: 2 },
      { start: 80, end: 104, overlapBefore: 2, overlapAfter: 0 },
    ])
  })

  it('creates two-row overlaps for a 104-row chart', () => {
    expect(createOverlappingSlices(0, 104, 29, 2)).toEqual([
      { start: 0, end: 29, overlapBefore: 0, overlapAfter: 2 },
      { start: 27, end: 56, overlapBefore: 2, overlapAfter: 2 },
      { start: 54, end: 83, overlapBefore: 2, overlapAfter: 2 },
      { start: 81, end: 104, overlapBefore: 2, overlapAfter: 0 },
    ])
  })

  it('retains absolute coordinates for a trimmed chart', () => {
    expect(createOverlappingSlices(5, 69, 29, 2)).toEqual([
      { start: 5, end: 34, overlapBefore: 0, overlapAfter: 2 },
      { start: 32, end: 61, overlapBefore: 2, overlapAfter: 2 },
      { start: 59, end: 69, overlapBefore: 2, overlapAfter: 0 },
    ])
  })

  it('keeps a short range on one page', () => {
    expect(createOverlappingSlices(8, 20, 42, 2)).toEqual([
      { start: 8, end: 20, overlapBefore: 0, overlapAfter: 0 },
    ])
  })
})
