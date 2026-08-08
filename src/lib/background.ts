import { rgbToLab, type Lab } from './color'
import type { BackgroundMode } from '../types'

interface Cluster {
  center: Lab
  count: number
}

const TRANSPARENT_ALPHA = 64
const MAX_CLUSTERS = 5

function labDistanceSquared(first: Lab, second: Lab) {
  return (first.l - second.l) ** 2 + (first.a - second.a) ** 2 + (first.b - second.b) ** 2
}

function findOpaqueBounds(pixels: Uint8ClampedArray, columns: number, rows: number) {
  let startColumn = columns
  let startRow = rows
  let endColumn = 0
  let endRow = 0

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (pixels[(row * columns + column) * 4 + 3] < TRANSPARENT_ALPHA) continue
      startColumn = Math.min(startColumn, column)
      startRow = Math.min(startRow, row)
      endColumn = Math.max(endColumn, column + 1)
      endRow = Math.max(endRow, row + 1)
    }
  }

  return startColumn < endColumn && startRow < endRow
    ? { startColumn, startRow, endColumn, endRow }
    : null
}

function getEdgeSamples(pixels: Uint8ClampedArray, columns: number, rows: number) {
  const bounds = findOpaqueBounds(pixels, columns, rows)
  if (!bounds) return []
  const width = bounds.endColumn - bounds.startColumn
  const height = bounds.endRow - bounds.startRow
  const thickness = Math.max(1, Math.min(3, Math.round(Math.min(width, height) * 0.025)))
  const sideEndRow = bounds.startRow + Math.max(1, Math.round(height * 0.86))
  const samples: Lab[] = []

  for (let row = bounds.startRow; row < sideEndRow; row += 1) {
    for (let column = bounds.startColumn; column < bounds.endColumn; column += 1) {
      const isTop = row < bounds.startRow + thickness
      const isSide = column < bounds.startColumn + thickness || column >= bounds.endColumn - thickness
      if (!isTop && !isSide) continue
      const pixel = (row * columns + column) * 4
      if (pixels[pixel + 3] < TRANSPARENT_ALPHA) continue
      samples.push(rgbToLab(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]))
    }
  }

  return samples
}

function clusterEdgeColors(samples: Lab[]) {
  if (samples.length === 0) return []
  const clusterCount = Math.min(MAX_CLUSTERS, Math.max(1, Math.round(Math.sqrt(samples.length / 22))))
  const average = samples.reduce((sum, sample) => ({
    l: sum.l + sample.l / samples.length,
    a: sum.a + sample.a / samples.length,
    b: sum.b + sample.b / samples.length,
  }), { l: 0, a: 0, b: 0 })
  const centers: Lab[] = [samples.reduce((nearest, sample) => (
    labDistanceSquared(sample, average) < labDistanceSquared(nearest, average) ? sample : nearest
  ), samples[0])]

  while (centers.length < clusterCount) {
    centers.push(samples.reduce((farthest, sample) => {
      const sampleDistance = Math.min(...centers.map((center) => labDistanceSquared(sample, center)))
      const farthestDistance = Math.min(...centers.map((center) => labDistanceSquared(farthest, center)))
      return sampleDistance > farthestDistance ? sample : farthest
    }, samples[0]))
  }

  let counts = new Array(clusterCount).fill(0) as number[]
  for (let iteration = 0; iteration < 7; iteration += 1) {
    const totals = Array.from({ length: clusterCount }, () => ({ l: 0, a: 0, b: 0 }))
    counts = new Array(clusterCount).fill(0) as number[]
    for (const sample of samples) {
      const index = centers.reduce((best, center, current) => (
        labDistanceSquared(sample, center) < labDistanceSquared(sample, centers[best]) ? current : best
      ), 0)
      totals[index].l += sample.l
      totals[index].a += sample.a
      totals[index].b += sample.b
      counts[index] += 1
    }
    for (let index = 0; index < clusterCount; index += 1) {
      if (counts[index] === 0) continue
      centers[index] = {
        l: totals[index].l / counts[index],
        a: totals[index].a / counts[index],
        b: totals[index].b / counts[index],
      }
    }
  }

  const clusters: Cluster[] = centers
    .map((center, index) => ({ center, count: counts[index] }))
    .filter((cluster) => cluster.count >= Math.max(2, samples.length * 0.045))
    .sort((first, second) => second.count - first.count)
  const selected: Cluster[] = []
  let coverage = 0
  for (const cluster of clusters) {
    selected.push(cluster)
    coverage += cluster.count / samples.length
    if (selected.length >= 4 || coverage >= 0.92) break
  }
  return selected.map((cluster) => cluster.center)
}

export function createVisibilityMask(
  pixels: Uint8ClampedArray,
  columns: number,
  rows: number,
  mode: BackgroundMode,
  tolerance: number,
) {
  const visible = new Uint8Array(columns * rows)
  const backgroundColors = mode === 'edge' ? clusterEdgeColors(getEdgeSamples(pixels, columns, rows)) : []
  const distanceLimit = Math.max(4, Math.min(36, tolerance)) ** 2

  for (let cell = 0; cell < columns * rows; cell += 1) {
    const pixel = cell * 4
    if (pixels[pixel + 3] < TRANSPARENT_ALPHA) continue
    if (backgroundColors.length > 0) {
      const color = rgbToLab(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2])
      if (backgroundColors.some((background) => labDistanceSquared(color, background) <= distanceLimit)) continue
    }
    visible[cell] = 1
  }

  return visible
}
