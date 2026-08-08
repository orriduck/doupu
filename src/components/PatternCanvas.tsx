import { useEffect, useRef } from 'react'
import { drawPattern } from '../lib/drawPattern'
import type { PatternResult, PatternView } from '../types'

interface PatternCanvasProps {
  result: PatternResult | null
  view: PatternView
  highlightIndex?: number | null
  className?: string
  label: string
}

export function PatternCanvas({ result, view, highlightIndex, className = '', label }: PatternCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !result) return
    const render = () => {
      const bounds = canvas.getBoundingClientRect()
      if (!bounds.width) return
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio))
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio))
      const context = canvas.getContext('2d')
      if (!context) return
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      // Screen previews prioritize fast interaction. Material codes are drawn
      // only by the high-resolution PNG/PDF export paths.
      drawPattern(context, result, view, bounds.width, bounds.height, {
        highlightIndex,
        cellLabels: false,
      })
    }
    render()
    const observer = new ResizeObserver(render)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [highlightIndex, result, view])

  return (
    <canvas
      ref={canvasRef}
      className={`pattern-canvas ${className}`}
      style={{ aspectRatio: result ? `${result.columns} / ${result.rows}` : '1 / 1' }}
      role="img"
      aria-label={label}
    />
  )
}
