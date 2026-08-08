import { CaretDown } from '@phosphor-icons/react'
import { BOARD_PRESETS } from '../data/boards'
import { PALETTE_OPTIONS } from '../data/palettes'
import type { PatternSettings } from '../types'

interface EditorControlsProps {
  settings: PatternSettings
  onChange: (settings: PatternSettings) => void
}

export function EditorControls({ settings, onChange }: EditorControlsProps) {
  const update = <Key extends keyof PatternSettings>(key: Key, value: PatternSettings[Key]) => {
    onChange({ ...settings, [key]: value })
  }

  const boardValue = `${settings.columns}x${settings.rows}`

  return (
    <div className="editor-controls" aria-label="图案设置">
      <label className="control-row control-row--select">
        <span>色盘</span>
        <span className="select-control">
          <select
            value={settings.paletteId}
            onChange={(event) => update('paletteId', event.currentTarget.value as PatternSettings['paletteId'])}
            aria-label="实体豆色盘"
          >
            {PALETTE_OPTIONS.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
          </select>
          <CaretDown size={14} weight="light" aria-hidden="true" />
        </span>
      </label>
      <label className="control-row control-row--select">
        <span>尺寸</span>
        <span className="select-control">
          <select
            value={boardValue}
            onChange={(event) => {
              const preset = BOARD_PRESETS.find((option) => option.value === event.currentTarget.value)
              if (preset) onChange({ ...settings, columns: preset.columns, rows: preset.rows })
            }}
            aria-label="实体豆板尺寸"
          >
            {BOARD_PRESETS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
          <CaretDown size={14} weight="light" aria-hidden="true" />
        </span>
      </label>
      <div className="fit-control">
        <div className="fit-heading"><span>图片适配</span><span>{settings.columns} × {settings.rows}</span></div>
        <div className="fit-options" role="group" aria-label="图片适配方式">
          <button type="button" className={settings.imageFit === 'cover' ? 'is-active' : ''} aria-pressed={settings.imageFit === 'cover'} onClick={() => update('imageFit', 'cover')}>裁切铺满</button>
          <button type="button" className={settings.imageFit === 'contain' ? 'is-active' : ''} aria-pressed={settings.imageFit === 'contain'} onClick={() => update('imageFit', 'contain')}>完整缩放</button>
        </div>
        <p>{settings.imageFit === 'cover' ? '保持比例，裁掉超出板型的部分。' : '保留整张图片，空白格不计入豆数。'}</p>
      </div>
      <label className="control-row">
        <span>颜色</span>
        <input
          type="range"
          min="8"
          max="36"
          step="2"
          value={settings.maxColors}
          onChange={(event) => update('maxColors', Number(event.currentTarget.value))}
          aria-label="最多颜色数量"
        />
        <span className="control-value">{settings.maxColors} 色</span>
      </label>
      <label className="control-row">
        <span>抖动</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.dither}
          onChange={(event) => update('dither', Number(event.currentTarget.value))}
          aria-label="抖动强度"
        />
        <span className="control-value">{Math.round(settings.dither * 100)}%</span>
      </label>
      <button
        type="button"
        className="control-row control-row--button"
        onClick={() => update('removeWhite', !settings.removeWhite)}
        aria-pressed={settings.removeWhite}
      >
        <span>背景</span>
        <span className="control-value">{settings.removeWhite ? '去白底' : '保留'}</span>
      </button>
    </div>
  )
}
