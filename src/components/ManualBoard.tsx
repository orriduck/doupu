import { ArrowUUpLeft, ArrowUUpRight, Trash } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { getPalette } from '../data/palettes'
import { drawLineCells, drawRectangleCells, EMPTY_CELL, floodFillCells, setArtworkCell, updateArtworkCells } from '../lib/manualPattern'
import type { BoardTool, ManualArtwork } from '../types'

interface CellPosition { column: number; row: number }

interface ManualBoardProps {
  artwork: ManualArtwork
  historyKey: number
  selectedColor: number
  tool: BoardTool
  onChange: (artwork: ManualArtwork) => void
  onPickColor: (index: number) => void
}

export function ManualBoard({ artwork, historyKey, selectedColor, tool, onChange, onPickColor }: ManualBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragStart = useRef<CellPosition | null>(null)
  const dragSnapshot = useRef<Uint16Array | null>(null)
  const lastCell = useRef<number | null>(null)
  const workingCells = useRef(artwork.cells)
  const undoStack = useRef<Uint16Array[]>([])
  const redoStack = useRef<Uint16Array[]>([])
  const [historyTick, setHistoryTick] = useState(0)
  const palette = getPalette(artwork.paletteId)
  workingCells.current = artwork.cells

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const render = () => {
      const bounds = canvas.getBoundingClientRect()
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(bounds.width * ratio))
      canvas.height = Math.max(1, Math.round(bounds.height * ratio))
      const context = canvas.getContext('2d')
      if (!context) return
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const cellWidth = bounds.width / artwork.columns
      const cellHeight = bounds.height / artwork.rows
      const minCell = Math.min(cellWidth, cellHeight)
      context.fillStyle = '#f3f1eb'
      context.fillRect(0, 0, bounds.width, bounds.height)
      artwork.cells.forEach((value, index) => {
        if (value === EMPTY_CELL) return
        const column = index % artwork.columns
        const row = Math.floor(index / artwork.columns)
        context.fillStyle = palette[value]?.hex ?? '#11110f'
        context.beginPath()
        context.arc((column + 0.5) * cellWidth, (row + 0.5) * cellHeight, minCell * 0.41, 0, Math.PI * 2)
        context.fill()
      })
      context.lineCap = 'square'
      for (let column = 0; column <= artwork.columns; column += 1) {
        context.beginPath()
        context.moveTo(column * cellWidth, 0)
        context.lineTo(column * cellWidth, bounds.height)
        context.strokeStyle = column % 5 === 0 ? 'rgba(17,17,15,.3)' : 'rgba(17,17,15,.09)'
        context.lineWidth = column % 5 === 0 ? 0.8 : 0.35
        context.stroke()
      }
      for (let row = 0; row <= artwork.rows; row += 1) {
        context.beginPath()
        context.moveTo(0, row * cellHeight)
        context.lineTo(bounds.width, row * cellHeight)
        context.strokeStyle = row % 5 === 0 ? 'rgba(17,17,15,.3)' : 'rgba(17,17,15,.09)'
        context.lineWidth = row % 5 === 0 ? 0.8 : 0.35
        context.stroke()
      }
    }
    render()
    const observer = new ResizeObserver(render)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [artwork, palette])

  useEffect(() => {
    undoStack.current = []
    redoStack.current = []
    setHistoryTick((value) => value + 1)
  }, [artwork.columns, artwork.paletteId, artwork.rows, historyKey])

  const locate = (event: ReactPointerEvent<HTMLCanvasElement>): CellPosition => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      column: Math.max(0, Math.min(artwork.columns - 1, Math.floor((event.clientX - bounds.left) / bounds.width * artwork.columns))),
      row: Math.max(0, Math.min(artwork.rows - 1, Math.floor((event.clientY - bounds.top) / bounds.height * artwork.rows))),
    }
  }

  const pushSnapshot = (snapshot: Uint16Array | null) => {
    if (!snapshot || snapshot.every((value, index) => value === workingCells.current[index])) return
    undoStack.current.push(snapshot)
    if (undoStack.current.length > 40) undoStack.current.shift()
    redoStack.current = []
    setHistoryTick((value) => value + 1)
  }

  const applyContinuous = (position: CellPosition) => {
    const cellIndex = position.row * artwork.columns + position.column
    if (lastCell.current === cellIndex) return
    lastCell.current = cellIndex
    const value = tool === 'eraser' ? EMPTY_CELL : selectedColor
    const cells = setArtworkCell(workingCells.current, artwork.columns, artwork.rows, position.column, position.row, value)
    workingCells.current = cells
    onChange(updateArtworkCells(artwork, cells))
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    const position = locate(event)
    dragStart.current = position
    dragSnapshot.current = artwork.cells.slice()
    lastCell.current = null
    if (tool === 'eyedropper') {
      const value = artwork.cells[position.row * artwork.columns + position.column]
      if (value !== EMPTY_CELL) onPickColor(value)
      dragSnapshot.current = null
      return
    }
    if (tool === 'fill') {
      const cells = floodFillCells(artwork.cells, artwork.columns, artwork.rows, position.column, position.row, selectedColor)
      if (!dragSnapshot.current.every((value, index) => value === cells[index])) {
        undoStack.current.push(dragSnapshot.current)
        redoStack.current = []
        setHistoryTick((value) => value + 1)
      }
      workingCells.current = cells
      onChange(updateArtworkCells(artwork, cells))
      dragSnapshot.current = null
      return
    }
    if (tool === 'pencil' || tool === 'eraser') applyContinuous(position)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragStart.current || (tool !== 'pencil' && tool !== 'eraser')) return
    applyContinuous(locate(event))
  }

  const finish = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    const start = dragStart.current
    const snapshot = dragSnapshot.current
    if (start && snapshot && (tool === 'line' || tool === 'rectangle')) {
      const end = locate(event)
      const cells = tool === 'line'
        ? drawLineCells(snapshot, artwork.columns, artwork.rows, start.column, start.row, end.column, end.row, selectedColor)
        : drawRectangleCells(snapshot, artwork.columns, artwork.rows, start.column, start.row, end.column, end.row, selectedColor)
      workingCells.current = cells
      onChange(updateArtworkCells(artwork, cells))
      undoStack.current.push(snapshot)
      redoStack.current = []
      setHistoryTick((value) => value + 1)
    } else if (tool === 'pencil' || tool === 'eraser') {
      pushSnapshot(snapshot)
    }
    dragStart.current = null
    dragSnapshot.current = null
    lastCell.current = null
  }

  const undo = () => {
    const previous = undoStack.current.pop()
    if (!previous) return
    redoStack.current.push(artwork.cells.slice())
    workingCells.current = previous
    onChange(updateArtworkCells(artwork, previous))
    setHistoryTick((value) => value + 1)
  }

  const redo = () => {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current.push(artwork.cells.slice())
    workingCells.current = next
    onChange(updateArtworkCells(artwork, next))
    setHistoryTick((value) => value + 1)
  }

  const clear = () => {
    if (artwork.cells.every((value) => value === EMPTY_CELL)) return
    undoStack.current.push(artwork.cells.slice())
    redoStack.current = []
    const cells = new Uint16Array(artwork.cells.length)
    cells.fill(EMPTY_CELL)
    workingCells.current = cells
    onChange(updateArtworkCells(artwork, cells))
    setHistoryTick((value) => value + 1)
  }

  return (
    <div className="manual-board-shell">
      <div className="manual-board-bar">
        <div><strong>自由画板</strong><span>{artwork.columns} × {artwork.rows}</span></div>
        <div className="history-actions" key={historyTick}>
          <button type="button" onClick={undo} disabled={!undoStack.current.length} aria-label="撤销"><ArrowUUpLeft size={18} weight="light" /></button>
          <button type="button" onClick={redo} disabled={!redoStack.current.length} aria-label="重做"><ArrowUUpRight size={18} weight="light" /></button>
          <button type="button" onClick={clear} aria-label="清空画板"><Trash size={18} weight="light" /></button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="manual-board-canvas"
        style={{ aspectRatio: `${artwork.columns} / ${artwork.rows}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        aria-label="拼豆自由画板"
      />
    </div>
  )
}
