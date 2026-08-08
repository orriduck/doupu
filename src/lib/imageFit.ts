import type { ImageFit } from '../types'

export interface ImageDrawRect {
  x: number
  y: number
  width: number
  height: number
}

export function getImageDrawRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fit: ImageFit,
): ImageDrawRect {
  const scale = fit === 'cover'
    ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
    : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return {
    x: (targetWidth - width) / 2,
    y: (targetHeight - height) / 2,
    width,
    height,
  }
}
