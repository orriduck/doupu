import { CaretDown, Check } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

export interface EditorialOption<Value extends string> {
  value: Value
  label: string
  meta?: string
}

interface EditorialSelectProps<Value extends string> {
  value: Value
  options: EditorialOption<Value>[]
  ariaLabel: string
  onChange: (value: Value) => void
}

export function EditorialSelect<Value extends string>({ value, options, ariaLabel, onChange }: EditorialSelectProps<Value>) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    if (!isOpen) return
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div className={`editorial-select ${isOpen ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="editorial-select__trigger"
        aria-label={`${ariaLabel}：${selected.label}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selected.label}</span>
        <CaretDown size={14} weight="light" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="editorial-select__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? 'is-selected' : ''}
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              <span className="editorial-select__mark">{option.value === value && <Check size={13} weight="bold" />}</span>
              <span className="editorial-select__label">{option.label}</span>
              {option.meta && <small>{option.meta}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
