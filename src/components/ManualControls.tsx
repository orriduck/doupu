import { Eraser, Eyedropper, LineSegment, PaintBucket, PencilSimple, Rectangle } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { BOARD_PRESETS } from '../data/boards'
import { getPalette, PALETTE_OPTIONS } from '../data/palettes'
import type { BoardTool, ManualArtwork, PatternSettings } from '../types'
import { EditorialSelect, type EditorialOption } from './EditorialSelect'

interface ManualControlsProps {
  artwork: ManualArtwork
  selectedColor: number
  tool: BoardTool
  brushSize: number
  onBoardChange: (columns: number, rows: number) => void
  onPaletteChange: (paletteId: PatternSettings['paletteId']) => void
  onColorChange: (index: number) => void
  onToolChange: (tool: BoardTool) => void
  onBrushSizeChange: (size: number) => void
}

const tools: Array<{ value: BoardTool; label: string; icon: typeof PencilSimple }> = [
  { value: 'pencil', label: '画笔', icon: PencilSimple },
  { value: 'eraser', label: '橡皮', icon: Eraser },
  { value: 'fill', label: '填充', icon: PaintBucket },
  { value: 'line', label: '直线', icon: LineSegment },
  { value: 'rectangle', label: '色块', icon: Rectangle },
  { value: 'eyedropper', label: '取色', icon: Eyedropper },
]

export function ManualControls(props: ManualControlsProps) {
  const [query, setQuery] = useState('')
  const palette = getPalette(props.artwork.paletteId)
  const selected = palette[props.selectedColor] ?? palette[0]
  const boardOptions: EditorialOption<string>[] = BOARD_PRESETS.map((option) => {
    const [label, meta] = option.label.split(' · ')
    return { value: option.value, label, meta }
  })
  const paletteOptions: EditorialOption<PatternSettings['paletteId']>[] = PALETTE_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
    meta: option.id === 'mard-221' ? '221 色系' : 'Midi 色系',
  }))
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return palette
    return palette.filter((color) => `${color.code} ${color.name}`.toLowerCase().includes(keyword))
  }, [palette, query])

  return (
    <div className="manual-controls" aria-label="自由画板工具">
      <section className="control-section manual-setup" aria-label="画板设置">
        <div className="control-row control-row--select">
          <span>板型</span>
          <EditorialSelect
            value={`${props.artwork.columns}x${props.artwork.rows}`}
            options={boardOptions}
            ariaLabel="自由画板尺寸"
            onChange={(value) => {
              const preset = BOARD_PRESETS.find((item) => item.value === value)
              if (preset) props.onBoardChange(preset.columns, preset.rows)
            }}
          />
        </div>
        <div className="control-row control-row--select">
          <span>色盘</span>
          <EditorialSelect value={props.artwork.paletteId} options={paletteOptions} ariaLabel="自由画板色盘" onChange={props.onPaletteChange} />
        </div>
      </section>

      <section className="tool-section" aria-labelledby="tool-title">
        <div className="manual-section-heading"><strong id="tool-title">绘制方式</strong><span>拖动可连续绘制</span></div>
        <div className="tool-grid" role="toolbar" aria-label="画板绘制工具">
          {tools.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.value} type="button" className={props.tool === item.value ? 'is-active' : ''} aria-pressed={props.tool === item.value} onClick={() => props.onToolChange(item.value)}>
                <Icon size={20} weight="light" aria-hidden="true" /><span>{item.label}</span>
              </button>
            )
          })}
        </div>
        {(props.tool === 'pencil' || props.tool === 'eraser') && (
          <label className="brush-size-control">
            <span>{props.tool === 'pencil' ? '画笔大小' : '橡皮大小'}</span>
            <input
              type="range"
              min="1"
              max="7"
              step="2"
              value={props.brushSize}
              aria-label={props.tool === 'pencil' ? '画笔大小' : '橡皮大小'}
              aria-valuetext={`${props.brushSize} 格`}
              onInput={(event) => props.onBrushSizeChange(Number(event.currentTarget.value))}
            />
            <output>{props.brushSize} 格</output>
          </label>
        )}
      </section>

      <section className="color-section" aria-labelledby="color-title">
        <div className="manual-section-heading">
          <strong id="color-title">豆色</strong>
          <span className="selected-color"><i style={{ background: selected.hex }} />{selected.code}</span>
        </div>
        <label className="color-search">
          <span className="visually-hidden">搜索色号或名称</span>
          <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="搜索色号或名称" />
        </label>
        <div className="color-grid" role="listbox" aria-label={`${selected.brand} 可用豆色`}>
          {filtered.map((color) => {
            const index = palette.indexOf(color)
            return (
              <button
                key={color.code}
                type="button"
                role="option"
                aria-selected={index === props.selectedColor}
                className={index === props.selectedColor ? 'is-active' : ''}
                onClick={() => props.onColorChange(index)}
                title={`${color.code} ${color.name}`}
              >
                <i style={{ background: color.hex }} aria-hidden="true" />
                <span>{color.code}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
