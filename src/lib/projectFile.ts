import { getPalette } from '../data/palettes'
import { createManualArtwork, EMPTY_CELL } from './manualPattern'
import type { ManualArtwork, PatternSettings, Workflow } from '../types'

const FORMAT = 'doupu-project'
const VERSION = 1
const MAX_PROJECT_SIZE = 64 * 1024 * 1024

interface EncodedCells {
  encoding: 'rle-v1'
  colors: string[]
  runs: number[]
}

export interface DoupuProject {
  format: typeof FORMAT
  version: typeof VERSION
  name: string
  savedAt: string
  activeWorkflow: Workflow
  photo: null | {
    settings: PatternSettings
    source: null | { name: string; type: string; dataUrl: string }
  }
  board: {
    columns: number
    rows: number
    paletteId: ManualArtwork['paletteId']
    cells: EncodedCells
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('无法读取项目中的原图。'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
}

export function encodeArtwork(artwork: ManualArtwork): EncodedCells {
  const palette = getPalette(artwork.paletteId)
  const used = Array.from(new Set(Array.from(artwork.cells).filter((value) => value !== EMPTY_CELL))).sort((a, b) => a - b)
  const compact = new Map(used.map((value, index) => [value, index]))
  const colors = used.map((value) => palette[value]?.code ?? '')
  const values = Array.from(artwork.cells, (value) => value === EMPTY_CELL ? -1 : compact.get(value) ?? -1)
  const runs: number[] = []
  let value = values[0] ?? -1
  let count = 0
  values.forEach((next) => {
    if (next === value) count += 1
    else {
      runs.push(value, count)
      value = next
      count = 1
    }
  })
  if (values.length) runs.push(value, count)
  return { encoding: 'rle-v1', colors, runs }
}

export function decodeArtwork(board: DoupuProject['board']): ManualArtwork {
  const artwork = createManualArtwork(board.columns, board.rows, board.paletteId)
  const palette = getPalette(board.paletteId)
  const lookup = new Map(palette.map((color, index) => [color.code, index]))
  const encodedLookup = board.cells.colors.map((code) => lookup.get(code) ?? EMPTY_CELL)
  let cursor = 0
  for (let index = 0; index < board.cells.runs.length; index += 2) {
    const encoded = board.cells.runs[index]
    const count = board.cells.runs[index + 1]
    const value = encoded < 0 ? EMPTY_CELL : encodedLookup[encoded] ?? EMPTY_CELL
    artwork.cells.fill(value, cursor, cursor + count)
    cursor += count
  }
  if (cursor !== artwork.cells.length) throw new Error('项目画板数据不完整。')
  return artwork
}

export async function createProjectFile(input: {
  name: string
  activeWorkflow: Workflow
  settings: PatternSettings
  source: { blob: Blob; name: string } | null
  artwork: ManualArtwork
}) {
  const source = input.source ? {
    name: input.source.name,
    type: input.source.blob.type || 'image/png',
    dataUrl: await blobToDataUrl(input.source.blob),
  } : null
  const project: DoupuProject = {
    format: FORMAT,
    version: VERSION,
    name: input.name || '我的豆谱',
    savedAt: new Date().toISOString(),
    activeWorkflow: input.activeWorkflow,
    photo: { settings: input.settings, source },
    board: {
      columns: input.artwork.columns,
      rows: input.artwork.rows,
      paletteId: input.artwork.paletteId,
      cells: encodeArtwork(input.artwork),
    },
  }
  return JSON.stringify(project)
}

export function downloadProjectFile(content: string, name: string) {
  const blob = new Blob([content], { type: 'application/vnd.doupu.project+json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${name || '我的豆谱'}.doupu`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function assertProject(value: unknown): asserts value is DoupuProject {
  if (!isRecord(value) || value.format !== FORMAT || value.version !== VERSION) throw new Error('这不是兼容的豆谱项目文件。')
  if (value.activeWorkflow !== 'photo' && value.activeWorkflow !== 'board') throw new Error('项目缺少制作方式。')
  if (!isRecord(value.board) || ![52, 74, 104].includes(Number(value.board.columns)) || value.board.columns !== value.board.rows) throw new Error('项目板型不受支持。')
  if (value.board.paletteId !== 'mard-221' && value.board.paletteId !== 'hama-midi') throw new Error('项目色盘不受支持。')
  if (!isRecord(value.board.cells) || value.board.cells.encoding !== 'rle-v1' || !Array.isArray(value.board.cells.colors) || !Array.isArray(value.board.cells.runs)) throw new Error('项目画板数据无法读取。')
  if (value.board.cells.runs.some((item) => !Number.isInteger(item))) throw new Error('项目画板数据无效。')
  if (!isRecord(value.photo) || !isRecord(value.photo.settings)) throw new Error('项目照片设置无法读取。')
  const settings = value.photo.settings
  if (!isRecord(settings) || ![52, 74, 104].includes(Number(settings.columns)) || settings.columns !== settings.rows) throw new Error('项目照片板型不受支持。')
  if (settings.paletteId !== 'mard-221' && settings.paletteId !== 'hama-midi') throw new Error('项目照片色盘不受支持。')
  if (settings.imageFit !== 'cover' && settings.imageFit !== 'contain') throw new Error('项目图片适配设置无效。')
  if (settings.backgroundMode !== 'keep' && settings.backgroundMode !== 'edge') throw new Error('项目背景设置无效。')
  const numericRanges: Array<[unknown, number, number]> = [
    [settings.cropX, 0, 1], [settings.cropY, 0, 1], [settings.cropZoom, 1, 4],
    [settings.maxColors, 2, 64], [settings.dither, 0, 1], [settings.backgroundTolerance, 0, 40],
  ]
  if (numericRanges.some(([item, minimum, maximum]) => typeof item !== 'number' || !Number.isFinite(item) || item < minimum || item > maximum)) throw new Error('项目照片参数超出范围。')
  const source = value.photo.source
  if (source !== null && (!isRecord(source) || typeof source.name !== 'string' || typeof source.type !== 'string' || typeof source.dataUrl !== 'string' || !source.dataUrl.startsWith('data:image/'))) throw new Error('项目原图无法读取。')
  const runs = value.board.cells.runs as number[]
  const colors = value.board.cells.colors as string[]
  if (runs.length % 2 !== 0 || runs.some((item) => !Number.isInteger(item))) throw new Error('项目画板数据无效。')
  let total = 0
  for (let index = 0; index < runs.length; index += 2) {
    const encoded = runs[index]
    const count = runs[index + 1]
    if (count <= 0 || (encoded !== -1 && (encoded < 0 || encoded >= colors.length))) throw new Error('项目画板数据无效。')
    total += count
  }
  if (total !== Number(value.board.columns) * Number(value.board.rows)) throw new Error('项目画板数据不完整。')
}

export async function parseProjectFile(file: File) {
  if (file.size > MAX_PROJECT_SIZE) throw new Error('项目文件超过 64 MB。')
  let value: unknown
  try { value = JSON.parse(await file.text()) } catch { throw new Error('项目文件不是有效的 JSON。') }
  assertProject(value)
  return { project: value, artwork: decodeArtwork(value.board) }
}

export async function projectSourceToFile(source: NonNullable<DoupuProject['photo']>['source']) {
  if (!source) return null
  const response = await fetch(source.dataUrl)
  const blob = await response.blob()
  return new File([blob], source.name || '项目原图', { type: source.type || blob.type })
}
