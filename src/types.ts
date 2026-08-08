export interface BeadColor {
  brand: string
  code: string
  name: string
  hex: string
  symbol: string
}

export type PaletteId = 'mard-221' | 'hama-midi'
export type ImageFit = 'cover' | 'contain'
export type BackgroundMode = 'keep' | 'edge'

export interface PatternSettings {
  columns: number
  rows: number
  paletteId: PaletteId
  imageFit: ImageFit
  cropX: number
  cropY: number
  cropZoom: number
  maxColors: number
  dither: number
  backgroundMode: BackgroundMode
  backgroundTolerance: number
}

export interface PatternResult {
  columns: number
  rows: number
  cells: Uint16Array
  palette: BeadColor[]
  counts: number[]
  totalBeads: number
}

export type PatternView = 'beads' | 'chart'

export interface SourceImage {
  bitmap: ImageBitmap
  name: string
  width: number
  height: number
  previewUrl: string
}
