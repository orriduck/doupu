import { DownloadSimple, FileArrowDown, FolderOpen, GithubLogo, List, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorControls } from './components/EditorControls'
import { Logo } from './components/Logo'
import { ManualBoard } from './components/ManualBoard'
import { ManualControls } from './components/ManualControls'
import { PatternCanvas } from './components/PatternCanvas'
import { UploadAction } from './components/UploadAction'
import { usePatternProcessor } from './hooks/usePatternProcessor'
import { downloadPatternPng } from './lib/drawPattern'
import { createManualArtwork, EMPTY_CELL, manualArtworkToPatternResult, patternResultToManualArtwork, remapArtworkPalette, resizeArtwork } from './lib/manualPattern'
import { createProjectFile, downloadProjectFile, parseProjectFile, projectSourceToFile } from './lib/projectFile'
import { getOccupiedBounds } from './lib/patternBounds'
import type { BoardTool, ManualArtwork, PatternSettings, PatternView, Workflow } from './types'

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
  backgroundMode: 'keep',
  backgroundTolerance: 10,
}

type WorkspaceView = 'board' | PatternView
type ExportStatus = 'idle' | 'pdf' | 'png' | 'project' | 'pdf-done' | 'png-done' | 'project-done'

export default function App() {
  const [settings, setSettings] = useState(initialSettings)
  const [workflow, setWorkflow] = useState<Workflow>('photo')
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('beads')
  const [artwork, setArtwork] = useState<ManualArtwork>(() => createManualArtwork())
  const [boardRevision, setBoardRevision] = useState(0)
  const [boardInitialized, setBoardInitialized] = useState(false)
  const [selectedColor, setSelectedColor] = useState(0)
  const [tool, setTool] = useState<BoardTool>('pencil')
  const [brushSize, setBrushSize] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [projectError, setProjectError] = useState<string | null>(null)
  const projectInputRef = useRef<HTMLInputElement>(null)
  const { source, result: photoResult, isProcessing, error, loadFile, clearSource } = usePatternProcessor(settings)
  const boardResult = useMemo(() => manualArtworkToPatternResult(artwork), [artwork])
  const activeResult = workflow === 'photo' ? photoResult : boardResult
  const projectName = source?.name ?? '我的豆谱'
  const occupiedBounds = useMemo(() => activeResult ? getOccupiedBounds(activeResult) : null, [activeResult])

  const handleFile = useCallback((file: File) => {
    setProjectError(null)
    setSettings((current) => ({ ...current, cropX: 0.5, cropY: 0.5, cropZoom: 1 }))
    void loadFile(file).catch(() => undefined)
  }, [loadFile])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const image = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith('image/'))
      if (image && workflow === 'photo') handleFile(image)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFile, workflow])

  const changeWorkflow = (next: Workflow) => {
    if (next === workflow) return
    setWorkflow(next)
    if (next === 'board') {
      setWorkspaceView('board')
    } else {
      setWorkspaceView('beads')
    }
  }

  const copyPhotoToBoard = () => {
    if (!photoResult) return
    setArtwork(patternResultToManualArtwork(photoResult, settings.paletteId))
    setSelectedColor(0)
    setBoardInitialized(true)
    setBoardRevision((value) => value + 1)
    setWorkspaceView('board')
  }

  const runExport = async (kind: 'pdf' | 'png') => {
    if (!activeResult || activeResult.totalBeads === 0 || exportStatus !== 'idle') return
    setExportStatus(kind)
    await new Promise<void>((resolve) => window.setTimeout(resolve, 40))
    try {
      if (kind === 'pdf') {
        const { exportPatternPdf } = await import('./lib/exportPdf')
        await exportPatternPdf(activeResult, projectName)
      } else {
        await downloadPatternPng(activeResult, projectName)
      }
      setExportStatus(kind === 'pdf' ? 'pdf-done' : 'png-done')
      window.setTimeout(() => setExportStatus('idle'), 2200)
    } catch {
      setExportStatus('idle')
    }
  }

  const saveProject = async () => {
    if (exportStatus !== 'idle') return
    setProjectError(null)
    setExportStatus('project')
    try {
      const content = await createProjectFile({
        name: projectName,
        activeWorkflow: workflow,
        settings,
        source: source ? { blob: source.blob, name: source.name } : null,
        artwork,
      })
      downloadProjectFile(content, projectName)
      setExportStatus('project-done')
      window.setTimeout(() => setExportStatus('idle'), 2200)
    } catch (reason) {
      setProjectError(reason instanceof Error ? reason.message : '项目保存失败。')
      setExportStatus('idle')
    }
  }

  const openProject = async (file: File) => {
    setProjectError(null)
    try {
      const { project, artwork: nextArtwork } = await parseProjectFile(file)
      setArtwork(nextArtwork)
      setBoardInitialized(nextArtwork.cells.some((value) => value !== EMPTY_CELL))
      setBoardRevision((value) => value + 1)
      setSelectedColor(0)
      setSettings(project.photo?.settings ?? initialSettings)
      const sourceFile = await projectSourceToFile(project.photo?.source ?? null)
      if (sourceFile) await loadFile(sourceFile)
      else clearSource()
      setWorkflow(project.activeWorkflow)
      setWorkspaceView(project.activeWorkflow === 'board' ? 'board' : 'beads')
    } catch (reason) {
      setProjectError(reason instanceof Error ? reason.message : '无法打开这个项目。')
    }
  }

  const viewTabs: Array<{ value: WorkspaceView; label: string }> = workflow === 'board'
    ? [{ value: 'board', label: '编辑画板' }, { value: 'beads', label: '效果图' }, { value: 'chart', label: '制作图纸' }]
    : [{ value: 'beads', label: '效果图' }, { value: 'chart', label: '制作图纸' }]

  return (
    <main className="site-shell" id="top">
      <header className="site-header">
        <Logo />
        <nav className="desktop-nav" aria-label="主要导航">
          <a className="is-active" href="#maker">制作</a>
          <a href="https://github.com/orriduck/doupu" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <button className="menu-toggle" type="button" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((value) => !value)}>
          <span>菜单</span>{isMenuOpen ? <X size={20} weight="thin" /> : <List size={20} weight="thin" />}
        </button>
        {isMenuOpen && (
          <nav className="mobile-nav" aria-label="移动导航">
            <a href="#maker" onClick={() => setIsMenuOpen(false)}>制作</a>
            <a href="https://github.com/orriduck/doupu" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        )}
      </header>

      <section className="maker maker--dual" id="maker">
        <div className="maker-primary">
          <div className="maker-intro">
            <h1><span>从照片开始，</span><br /><span>也可以一颗颗画。</span></h1>
            <p>两种制作方式，共用同一套实体豆色、图纸与项目文件。</p>
            <div className="workflow-switch" role="tablist" aria-label="制作方式">
              <button type="button" role="tab" aria-selected={workflow === 'photo'} className={workflow === 'photo' ? 'is-active' : ''} onClick={() => changeWorkflow('photo')}>
                <span>照片转图</span><small>裁切、配色</small>
              </button>
              <button type="button" role="tab" aria-selected={workflow === 'board'} className={workflow === 'board' ? 'is-active' : ''} onClick={() => changeWorkflow('board')}>
                <span>自由画板</span><small>自己选色绘制</small>
              </button>
            </div>
          </div>

          <div className="editor-column">
            {workflow === 'photo' ? (
              <>
                <UploadAction onFile={handleFile} />
                <EditorControls section="setup" source={source} settings={settings} onChange={setSettings} />
              </>
            ) : (
              <>
                {photoResult && boardInitialized && (
                  <button type="button" className="transfer-action" onClick={copyPhotoToBoard}>
                    <span>将照片效果放入画板</span><small>覆盖当前画板后继续手工修改</small>
                  </button>
                )}
                {photoResult && !boardInitialized && (
                  <button type="button" className="transfer-action" onClick={copyPhotoToBoard}>
                    <span>载入当前照片效果</span><small>不需要的话，直接在空白画板上绘制</small>
                  </button>
                )}
                <ManualControls
                  artwork={artwork}
                  selectedColor={selectedColor}
                  tool={tool}
                  brushSize={brushSize}
                  onBoardChange={(columns, rows) => { setArtwork((current) => resizeArtwork(current, columns, rows)); setBoardInitialized(true); setBoardRevision((value) => value + 1) }}
                  onPaletteChange={(paletteId) => { setArtwork((current) => remapArtworkPalette(current, paletteId)); setSelectedColor(0); setBoardInitialized(true); setBoardRevision((value) => value + 1) }}
                  onColorChange={setSelectedColor}
                  onToolChange={setTool}
                  onBrushSizeChange={setBrushSize}
                />
              </>
            )}
          </div>
        </div>

        {workflow === 'photo' && (
          <div className="completion-controls">
            <EditorControls section="color" source={source} settings={settings} onChange={setSettings} />
          </div>
        )}

        <div className="workbench-column workbench-primary">
          <div className="workbench-toolbar">
            <div className="view-tabs" role="tablist" aria-label="工作区视图">
              {viewTabs.map((tab) => (
                <button key={tab.value} type="button" role="tab" aria-selected={workspaceView === tab.value} className={workspaceView === tab.value ? 'is-active' : ''} onClick={() => setWorkspaceView(tab.value)}>{tab.label}</button>
              ))}
            </div>
            <div className="project-actions">
              <input
                ref={projectInputRef}
                className="visually-hidden"
                type="file"
                aria-label="打开豆谱项目文件"
                accept=".doupu,application/json,application/vnd.doupu.project+json"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (file) void openProject(file)
                  event.currentTarget.value = ''
                }}
              />
              <button type="button" onClick={() => projectInputRef.current?.click()}><FolderOpen size={18} weight="light" />打开项目</button>
              <button type="button" onClick={() => void saveProject()} disabled={exportStatus !== 'idle'}><FileArrowDown size={18} weight="light" />保存项目</button>
            </div>
          </div>

          <div
            className={`media-stage media-stage--workbench ${isDragging ? 'is-dragging' : ''}`}
            onDragEnter={(event) => { if (workflow === 'photo') { event.preventDefault(); setIsDragging(true) } }}
            onDragOver={(event) => { if (workflow === 'photo') event.preventDefault() }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false) }}
            onDrop={(event) => {
              if (workflow !== 'photo') return
              event.preventDefault()
              setIsDragging(false)
              const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'))
              if (file) handleFile(file)
            }}
          >
            {workflow === 'board' && workspaceView === 'board' ? (
              <ManualBoard artwork={artwork} historyKey={boardRevision} brushSize={brushSize} selectedColor={selectedColor} tool={tool} onChange={(next) => { setArtwork(next); setBoardInitialized(true) }} onPickColor={(index) => { setSelectedColor(index); setTool('pencil') }} />
            ) : (
              <div className="pattern-sheet pattern-sheet--single">
                <PatternCanvas
                  result={activeResult}
                  view={workspaceView === 'chart' ? 'chart' : 'beads'}
                  label={workspaceView === 'chart' ? '带色块和辅助线的拼豆图纸预览' : '拼豆效果预览'}
                />
              </div>
            )}
            {workflow === 'photo' && isProcessing && <div className="processing"><span />正在重新配色</div>}
            {isDragging && <div className="drop-message">松开即可换图</div>}
            {workflow === 'board' && workspaceView !== 'board' && activeResult?.totalBeads === 0 && (
              <div className="empty-overlay"><strong>画板还是空的</strong><span>回到编辑画板，先放下第一颗豆。</span></div>
            )}
          </div>

        </div>

        <div className="export-dock">
          <div className="export-summary">
            <strong>完成后导出</strong>
            <span>{occupiedBounds ? `${occupiedBounds.columns} × ${occupiedBounds.rows} 有效图案` : 'PDF、PNG 与可继续编辑的项目文件'}</span>
          </div>
          <button type="button" onClick={() => void runExport('pdf')} disabled={!activeResult || activeResult.totalBeads === 0 || exportStatus !== 'idle'}>
            <span><strong>{exportStatus === 'pdf' ? '正在排版' : exportStatus === 'pdf-done' ? 'PDF 已下载' : '打印图纸'}</strong><small>横向 PDF，分页含 2 格重叠</small></span>
            <DownloadSimple size={22} weight="light" />
          </button>
          <button type="button" onClick={() => void runExport('png')} disabled={!activeResult || activeResult.totalBeads === 0 || exportStatus !== 'idle'}>
            <span><strong>{exportStatus === 'png' ? '正在生成' : exportStatus === 'png-done' ? 'PNG 已下载' : '保存图纸'}</strong><small>带行列号、色号与辅助线</small></span>
            <DownloadSimple size={22} weight="light" />
          </button>
          <button type="button" onClick={() => void saveProject()} disabled={exportStatus !== 'idle'}>
            <span><strong>{exportStatus === 'project' ? '正在保存' : exportStatus === 'project-done' ? '项目已下载' : '保存项目'}</strong><small>.doupu，可再次打开继续制作</small></span>
            <FileArrowDown size={22} weight="light" />
          </button>
        </div>
      </section>

      {(error || projectError) && <div className="error-note" role="alert">{projectError ?? error}</div>}

      <footer className="site-footer">
        <div><Logo /><p>免费、开源，图片与项目都只在本机处理。</p></div>
        <a href="https://github.com/orriduck/doupu" target="_blank" rel="noreferrer"><GithubLogo size={19} weight="light" aria-hidden="true" />查看源码</a>
        <p className="palette-disclaimer">支持 MARD 221 与 Hama Midi 色号；屏幕颜色仅作近似参考，购买前请核对实体色卡。</p>
      </footer>
    </main>
  )
}
