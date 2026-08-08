import { jsPDF } from 'jspdf'
import { drawPattern } from './drawPattern'
import type { PatternResult } from '../types'

// A4 landscape proportions at roughly 150 dpi. Keeping the raster canvas and
// jsPDF page in the same orientation avoids browser print-dialog rotation.
const PAGE_WIDTH = 1754
const PAGE_HEIGHT = 1240
const INK = '#11110f'
const PAPER = '#fbfbf8'
const RED = '#b8352a'

function fitCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maximumSize: number,
  minimumSize: number,
  family: string,
) {
  let size = maximumSize
  while (size > minimumSize) {
    context.font = `${size}px ${family}`
    if (context.measureText(text).width <= maxWidth) return text
    size -= 2
  }
  context.font = `${minimumSize}px ${family}`
  if (context.measureText(text).width <= maxWidth) return text
  let fitted = text
  while (fitted.length > 1 && context.measureText(`${fitted}…`).width > maxWidth) fitted = fitted.slice(0, -1)
  return `${fitted}…`
}

function setupPage() {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_WIDTH
  canvas.height = PAGE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建 PDF 页面。')
  context.fillStyle = PAPER
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  return { canvas, context }
}

function addCanvas(pdf: jsPDF, canvas: HTMLCanvasElement, isFirst: boolean) {
  if (!isFirst) pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'landscape')
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT, undefined, 'FAST')
}

function drawCover(result: PatternResult, name: string) {
  const { canvas, context } = setupPage()
  context.fillStyle = INK
  context.font = '58px "Songti SC", "Noto Serif SC", serif'
  context.fillText('豆谱', 78, 104)
  context.font = '18px "Geist", sans-serif'
  context.letterSpacing = '4px'
  context.fillText('DOUPU / BEAD PATTERN', 80, 140)
  context.letterSpacing = '0px'
  context.strokeStyle = 'rgba(17,17,15,0.3)'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(78, 174)
  context.lineTo(PAGE_WIDTH - 78, 174)
  context.stroke()

  const title = fitCanvasText(context, name || '我的拼豆图案', PAGE_WIDTH - 156, 74, 38, '"Songti SC", "Noto Serif SC", serif')
  context.fillText(title, 78, 280)
  context.font = '24px "Geist", sans-serif'
  context.fillStyle = '#5f5f59'
  context.fillText(`${result.columns} × ${result.rows}  /  ${result.totalBeads.toLocaleString()} BEADS  /  ${result.palette.length} COLORS`, 82, 330)

  const previewSize = 960
  const preview = document.createElement('canvas')
  preview.width = previewSize
  preview.height = Math.round(previewSize * result.rows / result.columns)
  const previewContext = preview.getContext('2d')
  if (!previewContext) throw new Error('无法绘制效果图。')
  drawPattern(previewContext, result, 'beads', preview.width, preview.height)
  const maxPreviewWidth = 850
  const maxPreviewHeight = 760
  const renderScale = Math.min(1, maxPreviewWidth / preview.width, maxPreviewHeight / preview.height)
  const renderWidth = preview.width * renderScale
  const renderHeight = preview.height * renderScale
  const previewX = 78
  const previewY = 382
  context.save()
  context.shadowColor = 'rgba(17,17,15,0.12)'
  context.shadowBlur = 24
  context.shadowOffsetY = 10
  context.drawImage(preview, previewX, previewY, renderWidth, renderHeight)
  context.restore()

  const listX = 1010
  const listTop = 402
  context.fillStyle = INK
  context.font = '31px "Songti SC", "Noto Serif SC", serif'
  context.fillText('豆子清单', listX, listTop)
  context.font = '15px "Geist", sans-serif'
  context.fillStyle = '#71716c'
  context.fillText('格内符号与材料色号一致', listX, listTop + 31)

  const columnCount = result.palette.length <= 18 ? 1 : 2
  const rowsPerColumn = Math.ceil(result.palette.length / columnCount)
  const columnWidth = (PAGE_WIDTH - listX - 78) / columnCount
  context.font = '13px "Geist", sans-serif'
  context.fillStyle = '#71716c'
  for (let column = 0; column < columnCount; column += 1) {
    const x = listX + column * columnWidth
    context.fillText('BRAND', x, listTop + 70)
    context.fillText('CODE', x + 92, listTop + 70)
    context.textAlign = 'right'
    context.fillText('COUNT', x + columnWidth - 20, listTop + 70)
    context.textAlign = 'left'
  }
  result.palette.forEach((color, index) => {
    const column = Math.floor(index / rowsPerColumn)
    const row = index % rowsPerColumn
    const x = listX + column * columnWidth
    const y = listTop + 106 + row * 33
    if (y > PAGE_HEIGHT - 86) return
    context.fillStyle = color.hex
    context.beginPath()
    context.arc(x + 8, y - 5, 7, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = INK
    context.font = '14px "Geist", sans-serif'
    context.fillText(color.brand, x + 22, y)
    context.fillText(color.code, x + 92, y)
    context.textAlign = 'right'
    context.fillText(result.counts[index].toLocaleString(), x + columnWidth - 18, y)
    context.textAlign = 'left'
  })
  context.fillStyle = '#71716c'
  context.font = '13px "Geist", sans-serif'
  context.fillText('PRINT LANDSCAPE  /  CHART PAGES FOLLOW', listX, PAGE_HEIGHT - 64)
  context.fillStyle = RED
  context.fillRect(PAGE_WIDTH - 95, 78, 17, 17)
  return canvas
}

function drawChartPage(
  result: PatternResult,
  name: string,
  startColumn: number,
  startRow: number,
  endColumn: number,
  endRow: number,
  pageNumber: number,
  pageCount: number,
) {
  const { canvas, context } = setupPage()
  const marginX = 84
  const chartTop = 175
  const chartBottom = 100
  const labelSpace = 42
  const visibleColumns = endColumn - startColumn
  const visibleRows = endRow - startRow
  const cellSize = Math.min(
    (PAGE_WIDTH - marginX * 2 - labelSpace) / visibleColumns,
    (PAGE_HEIGHT - chartTop - chartBottom - labelSpace) / visibleRows,
  )
  const chartWidth = cellSize * visibleColumns
  const chartHeight = cellSize * visibleRows
  const chartX = (PAGE_WIDTH - chartWidth - labelSpace) / 2 + labelSpace
  const chartY = chartTop + labelSpace

  context.fillStyle = INK
  const pageTitle = fitCanvasText(context, name || '拼豆图纸', PAGE_WIDTH - marginX * 2 - 180, 31, 21, '"Songti SC", "Noto Serif SC", serif')
  context.fillText(pageTitle, marginX, 80)
  context.font = '16px "Geist", sans-serif'
  context.fillStyle = '#686862'
  context.fillText(`ROWS ${startRow + 1}–${endRow}  /  COLUMNS ${startColumn + 1}–${endColumn}`, marginX, 116)
  context.textAlign = 'right'
  context.fillText(`${String(pageNumber).padStart(2, '0')} / ${String(pageCount).padStart(2, '0')}`, PAGE_WIDTH - marginX, 116)
  context.textAlign = 'left'
  context.strokeStyle = 'rgba(17,17,15,0.25)'
  context.beginPath()
  context.moveTo(marginX, 145)
  context.lineTo(PAGE_WIDTH - marginX, 145)
  context.stroke()

  context.save()
  context.translate(chartX, chartY)
  drawPattern(context, result, 'chart', chartWidth, chartHeight, {
    startColumn,
    startRow,
    endColumn,
    endRow,
    cellLabels: true,
  })
  context.restore()

  context.font = '15px "Geist", sans-serif'
  context.fillStyle = '#4c4c48'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  for (let column = 0; column < visibleColumns; column += 1) {
    if ((column + startColumn) % 5 !== 0 && visibleColumns > 22) continue
    context.fillText(String(column + startColumn + 1), chartX + (column + 0.5) * cellSize, chartTop + labelSpace / 2)
  }
  context.textAlign = 'right'
  for (let row = 0; row < visibleRows; row += 1) {
    if ((row + startRow) % 5 !== 0 && visibleRows > 30) continue
    context.fillText(String(row + startRow + 1), chartX - 12, chartY + (row + 0.5) * cellSize)
  }
  context.textAlign = 'left'
  context.fillStyle = RED
  context.fillRect(marginX, PAGE_HEIGHT - 72, 80, 2)
  context.fillStyle = '#686862'
  context.font = '13px "Geist", sans-serif'
  context.fillText('MATERIAL CODE IN EVERY CELL  /  HEAVY GUIDE EVERY 5 CELLS  /  PRINT AT 100%', marginX + 100, PAGE_HEIGHT - 65)
  return canvas
}

export async function exportPatternPdf(result: PatternResult, name: string) {
  const tileColumns = 42
  const tileRows = 29
  const horizontalPages = Math.ceil(result.columns / tileColumns)
  const verticalPages = Math.ceil(result.rows / tileRows)
  const chartPageCount = horizontalPages * verticalPages
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [PAGE_WIDTH, PAGE_HEIGHT],
    compress: true,
    hotfixes: ['px_scaling'],
  })
  addCanvas(pdf, drawCover(result, name), true)
  let pageNumber = 1
  for (let pageRow = 0; pageRow < verticalPages; pageRow += 1) {
    for (let pageColumn = 0; pageColumn < horizontalPages; pageColumn += 1) {
      const startColumn = pageColumn * tileColumns
      const startRow = pageRow * tileRows
      const endColumn = Math.min(result.columns, startColumn + tileColumns)
      const endRow = Math.min(result.rows, startRow + tileRows)
      addCanvas(pdf, drawChartPage(
        result,
        name,
        startColumn,
        startRow,
        endColumn,
        endRow,
        pageNumber,
        chartPageCount,
      ), false)
      pageNumber += 1
    }
  }
  pdf.save(`${name || 'doupu-pattern'}.pdf`)
}
