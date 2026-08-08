export interface OverlappingSlice {
  start: number
  end: number
  overlapBefore: number
  overlapAfter: number
}

export function createOverlappingSlices(start: number, end: number, pageSize: number, overlap: number) {
  if (pageSize <= 0) throw new Error('分页尺寸必须大于 0。')
  if (overlap < 0 || overlap >= pageSize) throw new Error('重叠范围必须小于分页尺寸。')
  if (end <= start) return []

  const slices: OverlappingSlice[] = []
  let cursor = start
  while (cursor < end) {
    const sliceEnd = Math.min(end, cursor + pageSize)
    slices.push({
      start: cursor,
      end: sliceEnd,
      overlapBefore: slices.length === 0 ? 0 : overlap,
      overlapAfter: sliceEnd < end ? overlap : 0,
    })
    if (sliceEnd === end) break
    cursor = sliceEnd - overlap
  }
  return slices
}
