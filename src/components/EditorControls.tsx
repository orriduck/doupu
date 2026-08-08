import { CropEditor } from './CropEditor'
import { EditorialSelect, type EditorialOption } from './EditorialSelect'
import { BOARD_PRESETS } from '../data/boards'
import { PALETTE_OPTIONS } from '../data/palettes'
import type { PatternSettings, SourceImage } from '../types'

interface EditorControlsProps {
  source: SourceImage | null
  settings: PatternSettings
  onChange: (settings: PatternSettings) => void
}

export function EditorControls({ source, settings, onChange }: EditorControlsProps) {
  const update = <Key extends keyof PatternSettings>(key: Key, value: PatternSettings[Key]) => {
    onChange({ ...settings, [key]: value })
  }

  const boardValue = `${settings.columns}x${settings.rows}`
  const paletteOptions: EditorialOption<PatternSettings['paletteId']>[] = PALETTE_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
    meta: option.id === 'mard-221' ? '221 色系' : 'Midi 色系',
  }))
  const boardOptions: EditorialOption<string>[] = BOARD_PRESETS.map((option) => {
    const [label, meta] = option.label.split(' · ')
    return { value: option.value, label, meta }
  })

  return (
    <div className="editor-controls" aria-label="图案设置">
      <div className="control-row control-row--select">
        <span>色盘</span>
        <EditorialSelect value={settings.paletteId} options={paletteOptions} ariaLabel="实体豆色盘" onChange={(value) => update('paletteId', value)} />
      </div>
      <div className="control-row control-row--select">
        <span>尺寸</span>
        <EditorialSelect
          value={boardValue}
          options={boardOptions}
          ariaLabel="实体豆板尺寸"
          onChange={(value) => {
            const preset = BOARD_PRESETS.find((option) => option.value === value)
            if (preset) onChange({ ...settings, columns: preset.columns, rows: preset.rows })
          }}
        />
      </div>
      <div className="fit-control">
        <div className="fit-heading"><span>图片适配</span><span>{settings.columns} × {settings.rows}</span></div>
        <div className="fit-options" role="group" aria-label="图片适配方式">
          <button type="button" className={settings.imageFit === 'cover' ? 'is-active' : ''} aria-pressed={settings.imageFit === 'cover'} onClick={() => onChange({ ...settings, imageFit: 'cover', cropX: 0.5, cropY: 0.5, cropZoom: 1 })}>裁切铺满</button>
          <button type="button" className={settings.imageFit === 'contain' ? 'is-active' : ''} aria-pressed={settings.imageFit === 'contain'} onClick={() => onChange({ ...settings, imageFit: 'contain', cropX: 0.5, cropY: 0.5, cropZoom: 1 })}>完整缩放</button>
        </div>
        <p>{settings.imageFit === 'cover' ? '保持比例，裁掉超出板型的部分。' : '保留整张图片，空白格不计入豆数。'}</p>
      </div>
      {source && <CropEditor source={source} settings={settings} onChange={onChange} />}
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
      <div className="background-control">
        <div className="background-heading"><span>背景</span><span>{settings.backgroundMode === 'edge' ? '边缘去背' : '保留'}</span></div>
        <div className="background-options" role="group" aria-label="背景处理方式">
          <button type="button" className={settings.backgroundMode === 'keep' ? 'is-active' : ''} aria-pressed={settings.backgroundMode === 'keep'} onClick={() => update('backgroundMode', 'keep')}>保留</button>
          <button type="button" className={settings.backgroundMode === 'edge' ? 'is-active' : ''} aria-pressed={settings.backgroundMode === 'edge'} onClick={() => update('backgroundMode', 'edge')}>边缘去背</button>
        </div>
        {settings.backgroundMode === 'edge' && (
          <label className="background-range">
            <span>清理范围</span>
            <input type="range" min="6" max="30" step="1" value={settings.backgroundTolerance} onChange={(event) => update('backgroundTolerance', Number(event.currentTarget.value))} aria-label="背景清理范围" />
            <span>{settings.backgroundTolerance}</span>
          </label>
        )}
        <p>{settings.backgroundMode === 'edge' ? '从画面上沿与两侧识别背景；同色的内部区域也会一起清理。' : '保留照片中的全部颜色。'}</p>
      </div>
    </div>
  )
}
