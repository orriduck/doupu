import type { PatternSettings } from '../types'

interface EditorControlsProps {
  settings: PatternSettings
  onChange: (settings: PatternSettings) => void
}

export function EditorControls({ settings, onChange }: EditorControlsProps) {
  const update = <Key extends keyof PatternSettings>(key: Key, value: PatternSettings[Key]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="editor-controls" aria-label="图案设置">
      <div className="control-row control-row--static">
        <span>色盘</span>
        <span className="control-value">MARD 221</span>
      </div>
      <label className="control-row">
        <span>尺寸</span>
        <input
          type="range"
          min="24"
          max="96"
          step="8"
          value={settings.columns}
          onChange={(event) => update('columns', Number(event.currentTarget.value))}
          aria-label="图案宽度"
        />
        <span className="control-value">{settings.columns} 格宽</span>
      </label>
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
