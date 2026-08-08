import { useCallback, useEffect, useRef, useState } from 'react'
import { getPalette } from '../data/palettes'
import { getImageDrawRect } from '../lib/imageFit'
import type { PatternResult, PatternSettings, SourceImage } from '../types'

interface WorkerResult {
  id: number
  columns: number
  rows: number
  cells: ArrayBuffer
  palette: PatternResult['palette']
  counts: number[]
  totalBeads: number
}

const MAX_FILE_SIZE = 40 * 1024 * 1024
const MAX_DECODE_EDGE = 2048

async function createSafeBitmap(blob: Blob): Promise<ImageBitmap> {
  const original = await createImageBitmap(blob, { imageOrientation: 'from-image' })
  const longestEdge = Math.max(original.width, original.height)
  if (longestEdge <= MAX_DECODE_EDGE) return original
  const scale = MAX_DECODE_EDGE / longestEdge
  const resized = await createImageBitmap(original, 0, 0, original.width, original.height, {
    resizeWidth: Math.max(1, Math.round(original.width * scale)),
    resizeHeight: Math.max(1, Math.round(original.height * scale)),
    resizeQuality: 'high',
  })
  original.close()
  return resized
}

export function usePatternProcessor(settings: PatternSettings) {
  const [source, setSource] = useState<SourceImage | null>(null)
  const [result, setResult] = useState<PatternResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const requestRef = useRef(0)
  const sourceRef = useRef<SourceImage | null>(null)

  const replaceSource = useCallback(async (blob: Blob, name: string) => {
    if (blob.size > MAX_FILE_SIZE) throw new Error('图片超过 40 MB，请先缩小后再试。')
    if (blob.type && !blob.type.startsWith('image/')) throw new Error('请选择浏览器支持的图片文件。')
    setError(null)
    setIsProcessing(true)
    try {
      const bitmap = await createSafeBitmap(blob)
      const previewUrl = URL.createObjectURL(blob)
      const next: SourceImage = {
        bitmap,
        name,
        width: bitmap.width,
        height: bitmap.height,
        previewUrl,
      }
      const previous = sourceRef.current
      sourceRef.current = next
      setSource(next)
      previous?.bitmap.close()
      if (previous?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(previous.previewUrl)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '无法读取这张图片。'
      setError(message.includes('image') ? '浏览器无法解码这张图片，请换成 JPG、PNG 或 WebP。' : message)
      setIsProcessing(false)
      throw reason
    }
  }, [])

  const loadFile = useCallback(async (file: File) => {
    await replaceSource(file, file.name.replace(/\.[^.]+$/, '') || '我的拼豆图案')
  }, [replaceSource])

  useEffect(() => {
    const worker = new Worker(new URL('../workers/pattern.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<WorkerResult>) => {
      const data = event.data
      if (data.id !== requestRef.current) return
      setResult({
        columns: data.columns,
        rows: data.rows,
        cells: new Uint16Array(data.cells),
        palette: data.palette,
        counts: data.counts,
        totalBeads: data.totalBeads,
      })
      setIsProcessing(false)
    }
    worker.onerror = () => {
      setError('图案处理暂时失败，请重新选择图片。')
      setIsProcessing(false)
    }

    fetch('/sample-bird.webp')
      .then((response) => {
        if (!response.ok) throw new Error('示例图加载失败')
        return response.blob()
      })
      .then((blob) => replaceSource(blob, '蓝鸟与花'))
      .catch(() => setError('示例图加载失败，你仍然可以选择自己的图片。'))

    return () => {
      worker.terminate()
      workerRef.current = null
      const current = sourceRef.current
      current?.bitmap.close()
      if (current?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(current.previewUrl)
    }
  }, [replaceSource])

  useEffect(() => {
    if (!source || !workerRef.current) return
    setIsProcessing(true)
    const timer = window.setTimeout(() => {
      const { columns, rows } = settings
      const canvas = document.createElement('canvas')
      canvas.width = columns
      canvas.height = rows
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      const drawRect = getImageDrawRect(source.width, source.height, columns, rows, settings.imageFit)
      context.drawImage(source.bitmap, drawRect.x, drawRect.y, drawRect.width, drawRect.height)
      const imageData = context.getImageData(0, 0, columns, rows)
      const id = requestRef.current + 1
      requestRef.current = id
      workerRef.current?.postMessage({
        id,
        pixels: imageData.data.buffer,
        columns,
        rows,
        maxColors: settings.maxColors,
        dither: settings.dither,
        removeWhite: settings.removeWhite,
        palette: getPalette(settings.paletteId),
      }, [imageData.data.buffer])
    }, 90)
    return () => window.clearTimeout(timer)
  }, [settings, source])

  return { source, result, isProcessing, error, loadFile }
}
