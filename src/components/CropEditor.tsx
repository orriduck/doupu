import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { useMemo, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { getImageDrawRect } from '../lib/imageFit'
import type { PatternSettings, SourceImage } from '../types'

interface CropEditorProps {
  source: SourceImage
  settings: PatternSettings
  onChange: (settings: PatternSettings) => void
}

interface DragOrigin {
  clientX: number
  clientY: number
  cropX: number
  cropY: number
  width: number
  height: number
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

export function CropEditor({ source, settings, onChange }: CropEditorProps) {
  const dragOrigin = useRef<DragOrigin | null>(null)
  const drawRect = useMemo(() => getImageDrawRect(
    source.width,
    source.height,
    settings.columns,
    settings.rows,
    settings.imageFit,
    { x: settings.cropX, y: settings.cropY, zoom: settings.cropZoom },
  ), [settings.columns, settings.cropX, settings.cropY, settings.cropZoom, settings.imageFit, settings.rows, source.height, source.width])

  const updateZoom = (zoom: number) => onChange({
    ...settings,
    cropZoom: clamp(zoom, 1, 4),
  })

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOrigin.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      cropX: settings.cropX,
      cropY: settings.cropY,
      width: drawRect.width / settings.columns,
      height: drawRect.height / settings.rows,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = dragOrigin.current
    if (!origin) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const deltaX = (event.clientX - origin.clientX) / bounds.width
    const deltaY = (event.clientY - origin.clientY) / bounds.height
    const horizontalTravel = 1 - origin.width
    const verticalTravel = 1 - origin.height
    onChange({
      ...settings,
      cropX: Math.abs(horizontalTravel) < 0.0001 ? origin.cropX : clamp(origin.cropX + deltaX / horizontalTravel, 0, 1),
      cropY: Math.abs(verticalTravel) < 0.0001 ? origin.cropY : clamp(origin.cropY + deltaY / verticalTravel, 0, 1),
    })
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragOrigin.current = null
  }

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    updateZoom(settings.cropZoom * (event.deltaY > 0 ? 0.94 : 1.06))
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.05 : 0.01
    const movement = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }[event.key]
    if (!movement) return
    event.preventDefault()
    onChange({
      ...settings,
      cropX: clamp(settings.cropX + movement.x, 0, 1),
      cropY: clamp(settings.cropY + movement.y, 0, 1),
    })
  }

  return (
    <section className="crop-control" aria-labelledby="crop-title">
      <div className="crop-heading">
        <div>
          <strong id="crop-title">调整取景</strong>
          <span>拖动图片 · 滑杆缩放</span>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...settings, cropX: 0.5, cropY: 0.5, cropZoom: 1 })}
        >
          <ArrowCounterClockwise size={14} weight="light" aria-hidden="true" />复位
        </button>
      </div>
      <div
        className="crop-viewport"
        style={{ aspectRatio: `${settings.columns} / ${settings.rows}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        role="group"
        tabIndex={0}
        aria-label="拖动图片或使用方向键调整成品取景位置"
      >
        <img
          src={source.previewUrl}
          alt=""
          draggable={false}
          fetchPriority="high"
          style={{
            left: `${drawRect.x / settings.columns * 100}%`,
            top: `${drawRect.y / settings.rows * 100}%`,
            width: `${drawRect.width / settings.columns * 100}%`,
            height: `${drawRect.height / settings.rows * 100}%`,
          }}
        />
        <span className="crop-grid crop-grid--vertical" aria-hidden="true" />
        <span className="crop-grid crop-grid--horizontal" aria-hidden="true" />
        <span className="crop-frame" aria-hidden="true" />
      </div>
      <label className="crop-zoom">
        <span>缩放</span>
        <button type="button" aria-label="缩小取景" onClick={() => updateZoom(settings.cropZoom - 0.1)}>−</button>
        <input
          type="range"
          min="1"
          max="4"
          step="0.01"
          value={settings.cropZoom}
          onChange={(event) => updateZoom(Number(event.currentTarget.value))}
          aria-label="取景缩放倍率"
        />
        <button type="button" aria-label="放大取景" onClick={() => updateZoom(settings.cropZoom + 0.1)}>＋</button>
        <output>{settings.cropZoom.toFixed(2)}×</output>
      </label>
    </section>
  )
}
