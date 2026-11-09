import { useState, type ReactNode } from 'react'
import { DeskIcon as Icon } from './DeskIcon'
import { ICON } from './deskIcons'
import { move, parseTable } from './deskParsers'
import { chipCls, inputCls } from './deskStyles'
import { focusCell } from './focusCell'
import { PasteBox } from './PasteBox'
import { RowActions } from './RowActions'

// ── 표 편집 ──────────────────────────────────────
interface Column<T> {
  key: keyof T & string
  label: string
  width: string
  placeholder?: string
  type?: 'text' | 'number'
  render?: (value: T[keyof T], set: (v: string) => void) => ReactNode
}

interface RowTableProps<T> {
  tableId: string
  rows: T[]
  onChange: (rows: T[]) => void
  columns: Column<T>[]
  empty: () => T
  fromCells: (cells: string[]) => T
  addLabel: string
}

export function RowTable<T>({ tableId, rows, onChange, columns, empty, fromCells, addLabel }: RowTableProps<T>) {
  const [pasteOpen, setPasteOpen] = useState(false)
  const grid = `28px ${columns.map(c => c.width).join(' ')} 132px`

  const setCell = (r: number, key: keyof T, raw: string, type?: 'text' | 'number') => {
    const next = [...rows]
    next[r] = { ...next[r], [key]: type === 'number' ? Number(raw.replace(/[^\d]/g, '')) || 0 : raw }
    onChange(next)
  }

  /** 표 붙여넣기: 시작 칸(r,c)부터 오른쪽·아래로 채우고 모자라면 행을 늘린다 */
  const spread = (cells: string[][], r0: number, c0: number) => {
    const next = [...rows]
    cells.forEach((line, i) => {
      const r = r0 + i
      const base = next[r] ?? empty()
      // 시작 칸 앞 열은 기존 값 유지, 붙여넣은 칸만 덮어쓴다
      const current = columns.map(col => String(base[col.key] ?? ''))
      line.forEach((v, j) => {
        if (c0 + j < columns.length) current[c0 + j] = v
      })
      next[r] = fromCells(current)
    })
    onChange(next)
  }

  const onPaste = (e: React.ClipboardEvent, r: number, c: number) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text.includes('\t') && !text.trim().includes('\n')) return // 한 칸짜리는 기본 동작
    e.preventDefault()
    spread(parseTable(text), r, c)
  }

  const onKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    e.preventDefault()
    if (r === rows.length - 1) onChange([...rows, empty()])
    focusCell(tableId, r + 1, c)
  }

  return (
    <div>
      <div className="grid gap-2 px-1 pb-1.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/50" style={{ gridTemplateColumns: grid }}>
        <span />
        {columns.map(c => (
          <span key={c.key}>{c.label}</span>
        ))}
        <span />
      </div>
      <div className="space-y-1.5">
        {rows.map((row, r) => (
          <div key={r} className="group grid gap-2 items-center px-1 py-0.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02]" style={{ gridTemplateColumns: grid }}>
            <span className="text-center text-[12.5px] font-bold text-gray-400 dark:text-white/35 tabular-nums">{r + 1}</span>
            {columns.map((col, c) =>
              col.render ? (
                <div key={col.key}>{col.render(row[col.key], v => setCell(r, col.key, v))}</div>
              ) : (
                <input
                  key={col.key}
                  data-cell={`${tableId}:${r}:${c}`}
                  className={inputCls + (col.type === 'number' ? ' text-right tabular-nums' : '')}
                  inputMode={col.type === 'number' ? 'numeric' : undefined}
                  value={String(row[col.key] ?? '')}
                  placeholder={col.placeholder}
                  onChange={e => setCell(r, col.key, e.target.value, col.type)}
                  onPaste={e => onPaste(e, r, c)}
                  onKeyDown={e => onKeyDown(e, r, c)}
                />
              ),
            )}
            <RowActions
              index={r}
              count={rows.length}
              onMove={to => onChange(move(rows, r, to))}
              onDuplicate={() => onChange([...rows.slice(0, r + 1), { ...row }, ...rows.slice(r + 1)])}
              onRemove={() => onChange(rows.filter((_, i) => i !== r))}
            />
          </div>
        ))}
        {rows.length === 0 && (
          <p className="px-2 py-4 text-center text-[13.5px] text-gray-400 dark:text-white/40">
            아직 항목이 없어요. 추가하거나 표를 붙여넣어 보세요.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          className={chipCls}
          onClick={() => {
            onChange([...rows, empty()])
            focusCell(tableId, rows.length, columns.findIndex(c => !c.render))
          }}
        >
          <Icon d={ICON.plus} size={14} />
          {addLabel}
        </button>
        <button type="button" className={chipCls} onClick={() => setPasteOpen(v => !v)}>
          <Icon d={ICON.paste} size={14} />
          표 붙여넣기
        </button>
      </div>
      {pasteOpen && (
        <PasteBox
          hint={`엑셀·한글에서 표를 복사해 붙여넣으세요. 열 순서: ${columns.map(c => c.label).join(' · ')}`}
          preview={text => `${parseTable(text).length}행 인식`}
          onApply={(text, mode) => {
            const parsed = parseTable(text).map(fromCells)
            onChange(mode === 'replace' ? parsed : [...rows, ...parsed])
            setPasteOpen(false)
          }}
          onCancel={() => setPasteOpen(false)}
        />
      )}
    </div>
  )
}
