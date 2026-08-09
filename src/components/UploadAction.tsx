import { ArrowRight, LockSimple, UploadSimple } from '@phosphor-icons/react'
import { useRef } from 'react'

interface UploadActionProps {
  onFile: (file: File) => void
  compact?: boolean
}

export function UploadAction({ onFile, compact = false }: UploadActionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className={compact ? 'upload-action upload-action--compact' : 'upload-action'}>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        aria-label="选择图片文件"
        accept="image/jpeg,image/png,image/webp,image/avif,image/*"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) onFile(file)
          event.currentTarget.value = ''
        }}
      />
      <button type="button" className="upload-link" onClick={() => inputRef.current?.click()}>
        {compact && <UploadSimple size={18} weight="light" aria-hidden="true" />}
        <span>选择一张图片</span>
        <ArrowRight size={26} weight="thin" aria-hidden="true" />
      </button>
      {!compact && (
        <p className="privacy-note">
          <LockSimple size={14} weight="light" aria-hidden="true" />
          仅在本机处理
        </p>
      )}
    </div>
  )
}
