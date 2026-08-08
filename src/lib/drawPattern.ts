import type { PatternResult, PatternView } from '../types'

interface DrawOptions {
  highlightIndex?: number | null
  cellLabels?: boolean
  startColumn?: number
  startRow?: number
  endColumn?: number
  endRow?: number
}

function luminance(hex: string) {
  const value = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255)
  return channels.reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
}

export function drawPattern(
  context: CanvasRenderingContext2D,
  result: PatternResult,
  view: PatternView,
  width: number,
  height: number,
  options: DrawOptions = {},
) {
  const startColumn = options.startColumn ?? 0
  const startRow = options.startRow ?? 0
  const endColumn = options.endColumn ?? result.columns
  const endRow = options.endRow ?? result.rows
  const visibleColumns = endColumn - startColumn
  const visibleRows = endRow - startRow
  const cellWidth = width / visibleColumns
  const cellHeight = height / visibleRows
  const minCell = Math.min(cellWidth, cellHeight)
  context.clearRect(0, 0, width, height)
  context.fillStyle = view === 'beads' ? '#f2eee4' : '#fbfbf8'
  context.fillRect(0, 0, width, height)

  for (let row = startRow; row < endRow; row += 1) {
    for (let column = startColumn; column < endColumn; column += 1) {
      const paletteIndex = result.cells[row * result.columns + column]
      if (paletteIndex === 65535) continue
      const color = result.palette[paletteIndex]
      const x = (column - startColumn) * cellWidth
      const y = (row - startRow) * cellHeight
      const isMuted = options.highlightIndex != null && options.highlightIndex !== paletteIndex
      context.globalAlpha = isMuted ? 0.12 : 1

      if (view === 'beads') {
        const radius = minCell * 0.44
        const cx = x + cellWidth / 2
        const cy = y + cellHeight / 2
        context.save()
        context.shadowColor = 'rgba(17, 17, 15, 0.16)'
        context.shadowBlur = Math.max(0.5, minCell * 0.12)
        context.shadowOffsetY = minCell * 0.08
        context.beginPath()
        context.arc(cx, cy, radius, 0, Math.PI * 2)
        context.fillStyle = color.hex
        context.fill()
        context.restore()
        const gradient = context.createRadialGradient(
          cx - radius * 0.3,
          cy - radius * 0.34,
          radius * 0.08,
          cx,
          cy,
          radius,
        )
        gradient.addColorStop(0, 'rgba(255,255,255,0.34)')
        gradient.addColorStop(0.55, 'rgba(255,255,255,0)')
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)')
        context.beginPath()
        context.arc(cx, cy, radius, 0, Math.PI * 2)
        context.fillStyle = gradient
        context.fill()
        context.beginPath()
        context.arc(cx, cy, radius * 0.25, 0, Math.PI * 2)
        context.fillStyle = '#f5f1e8'
        context.fill()
        context.strokeStyle = 'rgba(17,17,15,0.16)'
        context.lineWidth = Math.max(0.4, minCell * 0.04)
        context.stroke()
      } else {
        context.fillStyle = `${color.hex}2e`
        context.fillRect(x, y, cellWidth, cellHeight)
        if ((options.cellLabels ?? true) && minCell >= 7) {
          context.fillStyle = luminance(color.hex) > 0.7 ? '#11110f' : color.hex
          context.font = `${Math.max(5, minCell * 0.5)}px "Geist", sans-serif`
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText(color.symbol, x + cellWidth / 2, y + cellHeight / 2 + minCell * 0.03)
        }
      }
    }
  }
  context.globalAlpha = 1

  if (view === 'chart') {
    context.lineCap = 'square'
    for (let column = 0; column <= visibleColumns; column += 1) {
      const sourceColumn = column + startColumn
      context.beginPath()
      context.moveTo(column * cellWidth, 0)
      context.lineTo(column * cellWidth, height)
      context.strokeStyle = sourceColumn % 5 === 0 ? 'rgba(17,17,15,0.5)' : 'rgba(17,17,15,0.16)'
      context.lineWidth = sourceColumn % 5 === 0 ? Math.max(0.7, minCell * 0.08) : Math.max(0.35, minCell * 0.035)
      context.stroke()
    }
    for (let row = 0; row <= visibleRows; row += 1) {
      const sourceRow = row + startRow
      context.beginPath()
      context.moveTo(0, row * cellHeight)
      context.lineTo(width, row * cellHeight)
      context.strokeStyle = sourceRow % 5 === 0 ? 'rgba(17,17,15,0.5)' : 'rgba(17,17,15,0.16)'
      context.lineWidth = sourceRow % 5 === 0 ? Math.max(0.7, minCell * 0.08) : Math.max(0.35, minCell * 0.035)
      context.stroke()
    }
  }
}

export function createPatternCanvas(result: PatternResult, view: PatternView, targetWidth = 1800) {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = Math.round(targetWidth * result.rows / result.columns)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建导出画布。')
  drawPattern(context, result, view, canvas.width, canvas.height)
  return canvas
}

export async function downloadPatternPng(result: PatternResult, name: string) {
  const canvas = createPatternCanvas(result, 'chart', Math.min(4096, Math.max(1800, result.columns * 40)))
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('PNG 生成失败')), 'image/png')
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${name || 'doupu-pattern'}-chart.png`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
