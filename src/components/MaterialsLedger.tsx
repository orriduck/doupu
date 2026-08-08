import { CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'
import type { PatternResult } from '../types'

interface MaterialsLedgerProps {
  result: PatternResult | null
  highlightIndex: number | null
  onHighlight: (index: number | null) => void
}

export function MaterialsLedger({ result, highlightIndex, onHighlight }: MaterialsLedgerProps) {
  const [expanded, setExpanded] = useState(false)
  const entries = result?.palette.map((color, index) => ({ color, index, count: result.counts[index] })) ?? []
  const visible = expanded ? entries : entries.slice(0, 6)

  return (
    <section className="materials" aria-labelledby="materials-title">
      <div className="materials-heading">
        <h2 id="materials-title">豆子清单</h2>
        <span>{result?.palette.length ?? 0} 色</span>
      </div>
      <div className="material-grid material-grid--head" aria-hidden="true">
        <span>品牌</span>
        <span>色号</span>
        <span>数量</span>
      </div>
      <div className="material-rows">
        {visible.map(({ color, index, count }) => (
          <button
            type="button"
            className={`material-grid material-row ${highlightIndex === index ? 'is-highlighted' : ''}`}
            key={`${color.brand}-${color.code}`}
            onClick={() => onHighlight(highlightIndex === index ? null : index)}
            title={`仅高亮 ${color.brand} ${color.code} ${color.name}`}
          >
            <span>{color.brand}</span>
            <span className="material-code">
              <i style={{ backgroundColor: color.hex }} aria-hidden="true" />
              {color.code}
            </span>
            <span className="material-count">{count.toLocaleString()}</span>
          </button>
        ))}
      </div>
      {entries.length > 6 && (
        <button type="button" className="materials-more" onClick={() => setExpanded((value) => !value)}>
          <span>{expanded ? '收起清单' : `查看全部 ${entries.length} 色`}</span>
          <CaretDown className={expanded ? 'is-up' : ''} size={16} weight="light" aria-hidden="true" />
        </button>
      )}
    </section>
  )
}
