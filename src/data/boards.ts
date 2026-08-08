export interface BoardPreset {
  value: string
  columns: number
  rows: number
  label: string
}

// Product sizes are deliberately simple and square so the uploaded image,
// preview, chart and exports all share one predictable finished dimension.
export const BOARD_PRESETS: BoardPreset[] = [
  { value: '52x52', columns: 52, rows: 52, label: '小号 · 52 × 52' },
  { value: '74x74', columns: 74, rows: 74, label: '标准 · 74 × 74' },
  { value: '104x104', columns: 104, rows: 104, label: '大号 · 104 × 104' },
]
