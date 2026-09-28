// 설교 메모장 공용 조각 — 설교 준비 하위 탭 · 메모 카드 · 설교 고르기 (훅 밖 헬퍼는 ./sermonNoteUtils)
import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  NOTE_KIND_ICON,
  NOTE_KIND_LABEL,
  fetchSermonOptions,
  type SermonNote,
  type SermonOption,
} from '../../../api/pastor'
import { formatDay, todayIso } from './pastorUtils'

// ── 설교 준비 하위 탭 ─────────────────────────────────────
const TABS = [
  { path: '/pastor/sermon', icon: 'insights', label: '준비 도우미' },
  { path: '/pastor/sermon/notes', icon: 'sticky_note_2', label: '설교 메모' },
  { path: '/pastor/sermon/outlines', icon: 'view_agenda', label: '개요 보드' },
]

export const SermonTabs = () => {
  const { pathname } = useLocation()
  const active = (p: string) => (p === '/pastor/sermon' ? pathname === p : pathname.startsWith(p))
  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-3 gap-1 p-1 lg:p-1.5 rounded-xl bg-gray-100 dark:bg-white/[0.05] lg:max-w-[520px]" role="tablist">
        {TABS.map(t => (
          <Link
            key={t.path}
            to={t.path}
            role="tab"
            aria-selected={active(t.path)}
            className={`flex items-center justify-center gap-1 py-2 lg:py-2.5 rounded-lg text-[13px] lg:text-[15px] font-bold transition-colors ${
              active(t.path) ? 'bg-white dark:bg-white/[0.12] text-brand shadow-sm' : 'text-gray-600 dark:text-white/65'
            }`}
          >
            <span className="material-icons-outlined text-[17px] lg:text-[19px]">{t.icon}</span>
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── 메모 카드 ────────────────────────────────────────────
export const UsedBadge = ({ note }: { note: SermonNote }) =>
  note.used_on ? (
    <span
      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.07] text-[12px] font-semibold text-gray-600 dark:text-white/65"
      title={note.used_sermon ? note.used_sermon.title : undefined}
    >
      <span className="material-icons-outlined text-[13px]">history</span>
      {formatDay(note.used_on, false)} 설교에 씀
    </span>
  ) : null

export const NoteCard = ({
  note,
  onOpen,
  trailing,
  compact = false,
}: {
  note: SermonNote
  onOpen?: () => void
  trailing?: ReactNode
  compact?: boolean
}) => {
  const Body = (
    <>
      <span className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-brand">
          <span className="material-icons-outlined text-[15px]">{NOTE_KIND_ICON[note.kind]}</span>
          {NOTE_KIND_LABEL[note.kind]}
        </span>
        {note.pinned && <span className="material-icons-outlined text-[14px] text-brand" title="고정">push_pin</span>}
        {note.from_visit && (
          <span className="inline-flex items-center gap-0.5 text-[12px] text-gray-500 dark:text-white/50" title="심방 기록에서 옮긴 메모">
            <span className="material-icons-outlined text-[13px]">lock</span>심방
          </span>
        )}
        <UsedBadge note={note} />
        {note.reasons?.map(r => (
          <span key={r} className="px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] font-semibold">
            {r}
          </span>
        ))}
        {!compact && note.created_at && (
          <span className="ml-auto text-[12px] text-gray-500 dark:text-white/50">{formatDay(note.created_at.slice(0, 10), false)}</span>
        )}
      </span>
      <span
        className={`block mt-1 text-[13px] lg:text-[14.5px] text-ink-strong leading-relaxed whitespace-pre-line ${
          compact ? 'line-clamp-2' : 'line-clamp-4'
        }`}
      >
        {note.body}
      </span>
      {note.source && <span className="block mt-0.5 text-[12px] text-gray-500 dark:text-white/50">— {note.source}</span>}
      {(note.refs.length > 0 || note.topics.length > 0 || note.tags.length > 0) && (
        <span className="mt-1.5 flex flex-wrap gap-1">
          {note.refs.map(r => (
            <span key={r.label} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[var(--brand-soft)] text-brand text-[12px] font-bold">
              <span className="material-icons-outlined text-[13px]">menu_book</span>
              {r.label}
            </span>
          ))}
          {note.topics.map(t => (
            <span key={t.id} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-[12px] font-semibold text-gray-600 dark:text-white/70">
              {t.name}
            </span>
          ))}
          {note.tags.map(t => (
            <span key={t} className="px-1.5 py-0.5 text-[12px] font-semibold text-gray-500 dark:text-white/55">
              #{t}
            </span>
          ))}
        </span>
      )}
    </>
  )
  const box =
    'rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02] px-3.5 py-3 transition-colors'
  return (
    <div className={`flex gap-2 ${box} ${onOpen ? 'hover:border-brand' : ''}`}>
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left">
          {Body}
        </button>
      ) : (
        <div className="flex-1 min-w-0">{Body}</div>
      )}
      {trailing && <div className="shrink-0 flex flex-col items-center gap-1">{trailing}</div>}
    </div>
  )
}

export const IconButton = ({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: string
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 ${
      danger
        ? 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-500 dark:text-white/60 hover:text-brand hover:bg-gray-100 dark:hover:bg-white/[0.06]'
    }`}
  >
    <span className="material-icons-outlined text-[18px] lg:text-[20px]">{icon}</span>
  </button>
)

// ── 어느 설교에 썼나요 ────────────────────────────────────
/** 최근 설교 목록에서 고르거나, 설교 등록 전이면 날짜만 남긴다 */
export const SermonPicker = ({
  onPick,
  pending,
}: {
  onPick: (choice: { sermon: SermonOption | null; date: string }) => void
  pending?: boolean
}) => {
  const { data, isPending } = useQuery({ queryKey: ['pastor-sermon-options'], queryFn: fetchSermonOptions })
  const [q, setQ] = useState('')
  const list = (data ?? []).filter(s => !q.trim() || `${s.title} ${s.bible_verse ?? ''}`.includes(q.trim()))
  return (
    <div className="space-y-2">
      <input
        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] text-ink-strong focus:outline-none focus:border-brand"
        placeholder="설교 제목·본문으로 찾기"
        value={q}
        onChange={e => setQ(e.target.value)}
      />
      <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1">
        {isPending ? (
          <p className="py-4 text-center text-[12.5px] text-gray-500">설교 목록을 불러오는 중...</p>
        ) : list.length === 0 ? (
          <p className="py-4 text-center text-[12.5px] text-gray-500">맞는 설교가 없습니다</p>
        ) : (
          list.map(s => (
            <button
              key={s.id}
              type="button"
              disabled={pending}
              onClick={() => onPick({ sermon: s, date: s.date })}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-brand disabled:opacity-40"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-ink-strong truncate">{s.title}</span>
                <span className="block text-[12px] text-gray-600 dark:text-white/60 truncate">{s.bible_verse || '본문 없음'}</span>
              </span>
              <span className="shrink-0 text-[12px] text-gray-600 dark:text-white/60">{formatDay(s.date, false)}</span>
            </button>
          ))
        )}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => onPick({ sermon: null, date: todayIso() })}
        className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.15] text-[12.5px] font-semibold text-gray-600 dark:text-white/65 hover:border-brand hover:text-brand disabled:opacity-40"
      >
        설교가 아직 등록 전이에요 — 오늘 날짜로만 기록
      </button>
    </div>
  )
}
