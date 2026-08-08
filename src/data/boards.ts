export interface BoardPreset {
  value: string
  columns: number
  rows: number
  label: string
}

// Hama's interlocking Midi square board has 841 pegs (29 × 29). These presets
// describe practical arrangements of that module rather than arbitrary pixels.
export const BOARD_PRESETS: BoardPreset[] = [
  { value: '29x29', columns: 29, rows: 29, label: '1 块 · 29 × 29' },
  { value: '58x29', columns: 58, rows: 29, label: '2 块横 · 58 × 29' },
  { value: '29x58', columns: 29, rows: 58, label: '2 块竖 · 29 × 58' },
  { value: '58x58', columns: 58, rows: 58, label: '4 块 · 58 × 58' },
  { value: '87x58', columns: 87, rows: 58, label: '6 块横 · 87 × 58' },
  { value: '58x87', columns: 58, rows: 87, label: '6 块竖 · 58 × 87' },
  { value: '87x87', columns: 87, rows: 87, label: '9 块 · 87 × 87' },
]
