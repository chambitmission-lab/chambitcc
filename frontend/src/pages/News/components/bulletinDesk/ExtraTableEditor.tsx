import type { ExtraBlock } from '../../../../types/digitalBulletin'
import { fitRows } from '../bulletinExtras'
import { DeskIcon as Icon } from './DeskIcon'
import { ICON } from './deskIcons'
import { parseTable } from './deskParsers'
import { chipCls, iconBtnCls, inputCls } from './deskStyles'
import { focusCell } from './focusCell'

export const ExtraTableEditor = ({ tableId, block, onChange }: { tableId: string; block: ExtraBlock; onChange: (next: ExtraBlock) => void }) => {
  const { columns, rows } = block
  const grid = `repeat(${columns.length}, minmax(110px, 1fr)) 36px`

  const update = (cols: string[], rs: string[][]) => onChange({ ...block, columns: cols, rows: fitRows(rs, cols.length) })

  /** 표 붙여넣기 — 머리줄(r=-1)에 붙이면 첫 줄이 열 이름, 나머지는 행. 칸이 모자라면 열·행을 늘린다 */
  const onPaste = (e: React.ClipboardEvent, r: number, c0: number) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text.includes('\t') && !text.trim().includes('\n')) return
    e.preventDefault()
    const cells = parseTable(text)
    const width = Math.max(columns.length, c0 + Math.max(...cells.map(l => l.length)))
    const cols = Array.from({ length: width }, (_, i) => columns[i] ?? '')
    const rs = fitRows(rows, width)
    const put = (target: string[], line: string[]) => line.forEach((v, j) => (target[c0 + j] = v))
    let body = cells
    if (r === -1) {
      put(cols, cells[0])
      body = cells.slice(1)
    }
    const start = Math.max(r, 0)
    body.forEach((line, i) => {
      rs[start + i] = rs[start + i] ?? Array(width).fill('')
      put(rs[start + i], line)
    })
    update(cols, rs)
  }

  const onKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    e.preventDefault()
    if (r === rows.length - 1) update(columns, [...rows, columns.map(() => '')])
    focusCell(tableId, r + 1, c)
  }

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="space-y-1.5" style={{ minWidth: columns.length * 116 + 36 }}>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: grid }}>
            {columns.map((col, c) => (
              <div key={c} className="relative">
                <input
                  data-cell={`${tableId}:-1:${c}`}
                  className={inputCls + ' pr-8 font-bold text-brand bg-[var(--brand-soft)] dark:bg-[var(--brand-soft)]'}
                  value={col}
                  placeholder={`열 ${c + 1}`}
                  onChange={e => update(columns.map((x, j) => (j === c ? e.target.value : x)), rows)}
                  onPaste={e => onPaste(e, -1, c)}
                  onKeyDown={e => onKeyDown(e, -1, c)}
                />
                {columns.length > 1 && (
                  <button
                    type="button"
                    title="열 삭제"
                    className="absolute right-1 top-1 w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500"
                    onClick={() => update(columns.filter((_, j) => j !== c), rows.map(row => row.filter((_, j) => j !== c)))}
                  >
                    <Icon d={ICON.close} size={13} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className={iconBtnCls + ' h-10'} title="열 추가" onClick={() => update([...columns, ''], rows)}>
              <Icon d={ICON.plus} />
            </button>
          </div>
          {rows.map((row, r) => (
            <div key={r} className="group/row grid gap-1.5" style={{ gridTemplateColumns: grid }}>
              {columns.map((_, c) => (
                <input
                  key={c}
                  data-cell={`${tableId}:${r}:${c}`}
                  className={inputCls}
                  value={row[c] ?? ''}
                  onChange={e => update(columns, rows.map((x, i) => (i === r ? columns.map((_, j) => (j === c ? e.target.value : x[j] ?? '')) : x)))}
                  onPaste={e => onPaste(e, r, c)}
                  onKeyDown={e => onKeyDown(e, r, c)}
                />
              ))}
              <button type="button" className={iconBtnCls + ' h-10 hover:!text-red-500'} title="행 삭제" onClick={() => update(columns, rows.filter((_, i) => i !== r))}>
                <Icon d={ICON.trash} size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button type="button" className={chipCls} onClick={() => update(columns, [...rows, columns.map(() => '')])}>
          <Icon d={ICON.plus} size={14} />
          행 추가
        </button>
        <span className="text-[12px] text-gray-400 dark:text-white/40">
          엑셀·한글 표를 머리줄에 붙여넣으면 열 이름까지, 아래 칸에 붙여넣으면 내용만 채워져요
        </span>
      </div>
    </div>
  )
}
