import { useState } from 'react'
import type { AnnouncementItem } from '../../../../types/digitalBulletin'
import { DeskIcon as Icon } from './DeskIcon'
import { ICON } from './deskIcons'
import { move, parseAnnouncements } from './deskParsers'
import { chipCls, inputCls, textareaCls } from './deskStyles'
import { PasteBox } from './PasteBox'
import { RowActions } from './RowActions'

// ── 소식 편집 ────────────────────────────────────
export const AnnouncementsEditor = ({ rows, onChange }: { rows: AnnouncementItem[]; onChange: (rows: AnnouncementItem[]) => void }) => {
  const [pasteOpen, setPasteOpen] = useState(false)
  const setField = (i: number, key: keyof AnnouncementItem, v: string) => {
    const next = [...rows]
    next[i] = { ...next[i], [key]: v }
    onChange(next)
  }
  return (
    <div>
      <div className="space-y-3">
        {rows.map((item, i) => (
          <div key={i} className="group flex gap-3 rounded-xl border border-gray-200/70 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02] p-3">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-brand text-[13px] font-bold flex items-center justify-center tabular-nums">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0 space-y-2">
              <input className={inputCls + ' font-semibold'} value={item.title} placeholder="소식 제목" onChange={e => setField(i, 'title', e.target.value)} />
              <textarea className={textareaCls} rows={2} value={item.content} placeholder="내용" onChange={e => setField(i, 'content', e.target.value)} />
            </div>
            <div className="shrink-0 self-start">
              <RowActions
                index={i}
                count={rows.length}
                onMove={to => onChange(move(rows, i, to))}
                onDuplicate={() => onChange([...rows.slice(0, i + 1), { ...item }, ...rows.slice(i + 1)])}
                onRemove={() => onChange(rows.filter((_, j) => j !== i))}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button type="button" className={chipCls} onClick={() => onChange([...rows, { title: `${rows.length + 1}. `, content: '' }])}>
          <Icon d={ICON.plus} size={14} />
          소식 추가
        </button>
        <button type="button" className={chipCls} onClick={() => setPasteOpen(v => !v)}>
          <Icon d={ICON.paste} size={14} />
          글 통째로 붙여넣기
        </button>
      </div>
      {pasteOpen && (
        <PasteBox
          hint="한글·워드의 광고 원고를 그대로 붙여넣으세요. '1.' '2.' 처럼 번호로 시작하는 줄마다 새 소식(번호가 없으면 빈 줄로 구분), 첫 줄은 제목·나머지는 내용이 돼요."
          preview={text => `${parseAnnouncements(text).length}건 인식`}
          onApply={(text, mode) => {
            const parsed = parseAnnouncements(text)
            onChange(mode === 'replace' ? parsed : [...rows, ...parsed])
            setPasteOpen(false)
          }}
          onCancel={() => setPasteOpen(false)}
        />
      )}
    </div>
  )
}
