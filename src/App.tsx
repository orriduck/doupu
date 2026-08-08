import { DownloadSimple, GithubLogo, List, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EditorControls } from './components/EditorControls'
import { Logo } from './components/Logo'
import { MaterialsLedger } from './components/MaterialsLedger'
import { PatternCanvas } from './components/PatternCanvas'
import { UploadAction } from './components/UploadAction'
import { downloadPatternPng } from './lib/drawPattern'
import { getOccupiedBounds } from './lib/patternBounds'
import { usePatternProcessor } from './hooks/usePatternProcessor'
import type { PatternSettings, PatternView } from './types'

const initialSettings: PatternSettings = {
  columns: 74,
  rows: 74,
  paletteId: 'mard-221',
  imageFit: 'cover',
  cropX: 0.5,
  cropY: 0.5,
  cropZoom: 1,
  maxColors: 24,
  dither: 0.2,
  removeWhite: false,
}

export default function App() {
  const [settings, setSettings] = useState(initialSettings)
  const [view, setView] = useState<PatternView>('beads')
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'pdf' | 'png' | 'pdf-done' | 'png-done'>('idle')
  const { source, result, isProcessing, error, loadFile } = usePatternProcessor(settings)

  const handleFile = useCallback((file: File) => {
    setHighlightIndex(null)
    setSettings((current) => ({ ...current, cropX: 0.5, cropY: 0.5, cropZoom: 1 }))
    void loadFile(file).catch(() => undefined)
  }, [loadFile])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const image = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith('image/'))
      if (image) handleFile(image)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFile])

  const runExport = async (kind: 'pdf' | 'png') => {
    if (!result || exportStatus !== 'idle') return
    setExportStatus(kind)
    await new Promise<void>((resolve) => window.setTimeout(resolve, 40))
    try {
      if (kind === 'pdf') {
        const { exportPatternPdf } = await import('./lib/exportPdf')
        await exportPatternPdf(result, source?.name ?? 'doupu-pattern')
      } else {
        await downloadPatternPng(result, source?.name ?? 'doupu-pattern')
      }
      setExportStatus(kind === 'pdf' ? 'pdf-done' : 'png-done')
      window.setTimeout(() => setExportStatus('idle'), 2200)
    } catch {
      setExportStatus('idle')
    }
  }

  const totalLabel = result?.totalBeads.toLocaleString() ?? '—'
  const colorLabel = result?.palette.length ?? '—'
  const occupiedBounds = useMemo(() => result ? getOccupiedBounds(result) : null, [result])

  return (
    <main className="site-shell" id="top">
      <header className="site-header">
        <Logo />
        <nav className="desktop-nav" aria-label="主要导航">
          <a className="is-active" href="#maker">制作</a>
          <a href="https://github.com/orriduck/doupu" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          <span>菜单</span>
          {isMenuOpen ? <X size={20} weight="thin" /> : <List size={20} weight="thin" />}
        </button>
        {isMenuOpen && (
          <nav className="mobile-nav" aria-label="移动导航">
            <a href="#maker" onClick={() => setIsMenuOpen(false)}>制作</a>
            <a href="https://github.com/orriduck/doupu" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        )}
      </header>

      <section className="maker" id="maker">
        <div className="maker-intro">
          <h1><span>把喜欢的画面，</span><br /><span>做成一颗颗豆。</span></h1>
          <p>上传照片，调整尺寸与颜色，生成可以真正照着拼的图纸。</p>
          <UploadAction onFile={handleFile} />
        </div>

        <div className="editor-column">
          <EditorControls source={source} settings={settings} onChange={setSettings} />
          <div className="stats" aria-live="polite">
            <div><strong>{totalLabel}</strong><span>颗</span></div>
            <div><strong>{colorLabel}</strong><span>色</span></div>
          </div>
        </div>

        <div
          className={`media-stage ${isDragging ? 'is-dragging' : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'))
            if (file) handleFile(file)
          }}
        >
          <div className="preview-header">
            <span>{view === 'chart' && occupiedBounds ? `${occupiedBounds.columns} × ${occupiedBounds.rows} 图纸` : '预览'}</span>
            <div className="view-tabs" role="tablist" aria-label="预览模式">
              <button role="tab" aria-selected={view === 'beads'} className={view === 'beads' ? 'is-active' : ''} onClick={() => setView('beads')}>效果图</button>
              <button role="tab" aria-selected={view === 'chart'} className={view === 'chart' ? 'is-active' : ''} onClick={() => setView('chart')}>制作图纸</button>
            </div>
          </div>
          <div className="pattern-sheet pattern-sheet--main">
            <PatternCanvas result={result} view={view} highlightIndex={highlightIndex} label={view === 'beads' ? '拼豆效果预览' : '带色块和辅助线的拼豆图纸预览'} />
          </div>
          <div className="pattern-sheet pattern-sheet--peek" aria-hidden="true">
            <div className="peek-meta"><span>{result ? `${result.columns} × ${result.rows}` : '—'}</span><span>{totalLabel} 颗</span></div>
            <PatternCanvas result={result} view={view === 'beads' ? 'chart' : 'beads'} label="另一种预览" />
          </div>
          {isProcessing && <div className="processing"><span />正在重新配色</div>}
          {isDragging && <div className="drop-message">松开即可换图</div>}
        </div>

        <div className="maker-ledger">
          <MaterialsLedger result={result} highlightIndex={highlightIndex} onHighlight={setHighlightIndex} />
          <section className="export-panel" aria-labelledby="export-title">
            <div className="export-heading">
              <h2 id="export-title">下载</h2>
              <span>选择使用方式</span>
            </div>
            <div className="export-actions">
              <button type="button" onClick={() => void runExport('pdf')} disabled={!result || exportStatus !== 'idle'}>
                <span className="export-copy">
                  <strong>{exportStatus === 'pdf' ? '正在排版…' : exportStatus === 'pdf-done' ? '制作图纸已下载' : '打印制作图纸'}</strong>
                  <small>PDF · 含效果图、分页图纸和豆子清单</small>
                </span>
                <DownloadSimple size={23} weight="light" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => void runExport('png')} disabled={!result || exportStatus !== 'idle'}>
                <span className="export-copy">
                  <strong>{exportStatus === 'png' ? '正在生成…' : exportStatus === 'png-done' ? '图纸图片已下载' : '保存图纸图片'}</strong>
                  <small>PNG · 单张带网格和格内符号的图纸</small>
                </span>
                <DownloadSimple size={23} weight="light" aria-hidden="true" />
              </button>
            </div>
          </section>
          <UploadAction onFile={handleFile} compact />
        </div>
      </section>

      {error && <div className="error-note" role="alert">{error}</div>}

      <footer className="site-footer">
        <div>
          <Logo />
          <p>免费、开源，图片不离开你的设备。</p>
        </div>
        <a href="https://github.com/orriduck/doupu" target="_blank" rel="noreferrer">
          <GithubLogo size={19} weight="light" aria-hidden="true" />查看源码
        </a>
        <p className="palette-disclaimer">支持 MARD 221 与 Hama Midi 色号；屏幕颜色仅作近似参考，购买前请核对实体色卡。</p>
      </footer>
    </main>
  )
}
