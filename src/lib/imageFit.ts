import type { ImageFit } from '../types'

export interface ImageDrawRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageCrop {
  x: number
  y: number
  zoom: number
}

const DEFAULT_CROP: ImageCrop = { x: 0.5, y: 0.5, zoom: 1 }
const normalizeZero = (value: number) => Object.is(value, -0) ? 0 : value

export function getImageDrawRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fit: ImageFit,
  crop: ImageCrop = DEFAULT_CROP,
): ImageDrawRect {
  const baseScale = fit === 'cover'
    ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
    : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const scale = baseScale * Math.max(1, crop.zoom)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return {
    x: normalizeZero((targetWidth - width) * Math.min(1, Math.max(0, crop.x))),
    y: normalizeZero((targetHeight - height) * Math.min(1, Math.max(0, crop.y))),
    width,
    height,
  }
}
