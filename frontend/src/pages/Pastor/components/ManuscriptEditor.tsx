// 원고 쓰기 — 개요 칸마다 실제로 말할 글을 쓴다 (PastorSermonOutline 의 ?mode=manuscript)
//   원고(PC 왼쪽 넓은 단): 칸별 원고. "/요 15:5" 를 치면 말씀을 찾아 넣는다(기도 작성의 "/말씀"과 같은 흐름).
//          빈 줄이 강단 보기의 장 경계 — 말씀 인용만 있는 문단은 강단에서 말씀 카드로 보인다.
//   오른쪽 단: 칸 목록·칸별 예상 시간·말하는 빠르기 / 참고용 점검(규칙)·AI 원고 점검(누를 때만)·인용한 말씀·이미 쓴 예화 알림
// 저장은 부모의 개요 저장(입력이 멈추고 1초 뒤)을 그대로 탄다.
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { OutlineSection, SermonNote } from '../../../api/pastor'
import { findSlashMatch, useVerseSlash } from '../../Home/components/PrayerComposer/verseSlash'
import { VerseSlashPanel } from '../../Home/components/PrayerComposer/VerseSlashPanel'
import ManuscriptReviewPanel from './ManuscriptReviewPanel'
import { formatDay } from './pastorUtils'
import {
  PACES,
  checkManuscript,
  countChars,
  estimateMinutes,
  quotedVerses,
  reusedNotes,
  sectionBody,
  usePace,
} from './manuscript'

const MAX_LEN = 20000

const ManuscriptEditor = ({
  outlineId,
  draft,
  status,
  notes,
  onChange,
  flush,
}: {
  outlineId: number
  draft: { title: string; passage: string; preach_on: string; sections: OutlineSection[] }
  status: 'draft' | 'done'
  notes: Record<number, SermonNote>
  onChange: (sectionId: string, manuscript: string) => void
  /** 입력 중인 원고를 바로 저장 — AI 점검은 저장된 원고를 읽는다 */
  flush?: () => Promise<unknown>
}) => {
  const [pace, setPace, perMin] = usePace()
  const [active, setActive] = useState(draft.sections[0]?.id ?? '')
  const chars = draft.sections.map(s => countChars(sectionBody(s)))
  const total = chars.reduce((a, b) => a + b, 0)
  const minutes = estimateMinutes(total, perMin)
  const checks = useMemo(() => checkManuscript(draft.sections, perMin), [draft.sections, perMin])
  const quotes = useMemo(() => quotedVerses(draft.sections), [draft.sections])
  const reused = status === 'draft' ? reusedNotes(draft.sections, notes) : []

  const jump = (id: string) => {
    setActive(id)
    document.getElementById(`ms-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="px-4 pt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      {/* 원고 */}
      <div className="min-w-0 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6 py-3 border-b border-gray-200/70 dark:border-white/[0.06]">
          <span className="min-w-0 truncate text-[13.5px] lg:text-[15px] font-bold text-ink-strong">
            {[draft.passage, draft.title].filter(Boolean).join(' · ')}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] lg:text-[13.5px] font-bold whitespace-nowrap">
            <span className="material-icons-outlined text-[15px]">timer</span>
            {total.toLocaleString()}자 · 예상 {minutes}분
          </span>
          {/* 한 단 화면에선 점검 패널이 원고 아래 멀리 있다 — 바로 가는 버튼 */}
          <button
            type="button"
            onClick={() => document.getElementById('ms-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="lg:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand text-white text-[12.5px] font-bold whitespace-nowrap"
          >
            <span className="material-icons-outlined text-[16px]">rate_review</span>AI 점검
          </button>
          <Link
            to={`/pastor/sermon/outlines/${outlineId}/pulpit`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-ink-strong text-white dark:bg-white dark:text-black text-[12.5px] lg:text-[13.5px] font-bold whitespace-nowrap"
          >
            <span className="material-icons-outlined text-[16px]">menu_book</span>강단 보기
          </Link>
        </div>
        <div className="px-4 lg:px-8 py-5 space-y-8">
          {draft.sections.map(s => (
            <SectionManuscript
              key={s.id}
              section={s}
              notes={s.note_ids.map(id => notes[id]).filter(Boolean)}
              onFocus={() => setActive(s.id)}
              onChange={v => onChange(s.id, v)}
            />
          ))}
          <p className="text-[12.5px] lg:text-[13.5px] text-gray-500 dark:text-white/50 leading-relaxed">
            빈 줄로 문단을 나누면 강단 보기에서 한 장씩 넘어갑니다. 칸을 더하거나 순서를 바꾸려면 위의 '개요'로 가세요.
          </p>
        </div>
      </div>

      {/* 오른쪽 단 — 칸 목록 · 점검 (목회자 화면은 큰 글씨 zoom 이라 3단이면 원고 칸이 좁아져 2단으로) */}
      <div className="space-y-4">
          <Panel title="칸" icon="view_agenda">
            <ol className="space-y-0.5">
              {draft.sections.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => jump(s.id)}
                    className={`w-full text-left rounded-xl px-3 py-2 transition-colors ${
                      active === s.id ? 'bg-[var(--brand-soft)] ring-1 ring-brand/40' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className={`block text-[13.5px] lg:text-[14.5px] font-bold truncate ${active === s.id ? 'text-brand' : 'text-ink-strong'}`}>{s.label}</span>
                    <span className="block text-[12px] lg:text-[13px] text-gray-500 dark:text-white/55">
                      {chars[i] ? `약 ${estimateMinutes(chars[i], perMin)}분 · ${chars[i].toLocaleString()}자` : '비어 있음'}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            {total > 0 && (
              <div className="mt-3 flex h-2 rounded-full overflow-hidden gap-0.5" aria-hidden>
                {draft.sections.map((s, i) =>
                  chars[i] ? <span key={s.id} className={`bg-brand ${active === s.id ? '' : 'opacity-30'}`} style={{ flex: chars[i] }} /> : null,
                )}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200/70 dark:border-white/[0.06]">
              <p className="text-[12px] lg:text-[13px] font-bold text-gray-600 dark:text-white/60 mb-1.5">말하는 빠르기</p>
              <div className="grid grid-cols-3 gap-1">
                {PACES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPace(p.id)}
                    aria-pressed={pace === p.id}
                    className={`py-1.5 rounded-lg text-[12.5px] lg:text-[13px] font-bold ${
                      pace === p.id ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[12px] text-gray-500 dark:text-white/50">1분에 약 {perMin}자로 셉니다</p>
            </div>
          </Panel>
        <Panel title="참고용 점검" icon="task_alt" hint="규칙으로 · AI 없이">
          <ul className="space-y-2.5">
            {checks.map(c => (
              <li key={c.id} className="flex gap-2">
                <span className={`material-icons-outlined text-[19px] ${c.done ? 'text-brand' : 'text-gray-300 dark:text-white/25'}`}>
                  {c.done ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13.5px] lg:text-[14.5px] font-semibold ${c.done ? 'text-ink-strong' : 'text-gray-600 dark:text-white/60'}`}>{c.label}</span>
                  <span className="block text-[12px] lg:text-[13px] text-gray-500 dark:text-white/50">{c.hint}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <ManuscriptReviewPanel outlineId={outlineId} sections={draft.sections} flush={flush} />
        {quotes.length > 0 && (
          <Panel title="인용한 말씀" icon="format_quote">
            <div className="flex flex-wrap gap-1.5">
              {quotes.map(q => (
                <span key={q} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.07] text-[12.5px] lg:text-[13.5px] font-semibold text-gray-700 dark:text-white/75">
                  {q}
                </span>
              ))}
            </div>
          </Panel>
        )}
        {reused.length > 0 && (
          <div className="rounded-2xl p-3.5 bg-amber-50 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/25">
            <p className="flex items-center gap-1 text-[13px] lg:text-[14px] font-bold text-amber-800 dark:text-amber-300">
              <span className="material-icons-outlined text-[17px]">history</span>이미 쓴 예화·메모
            </p>
            <ul className="mt-1.5 space-y-1">
              {reused.map(n => (
                <li key={n.id} className="text-[12.5px] lg:text-[13.5px] leading-relaxed text-amber-900/85 dark:text-amber-200/85">
                  "{n.body.length > 30 ? `${n.body.slice(0, 30)}…` : n.body}" — {formatDay(n.used_on!, false)}
                  {n.used_sermon ? ` 「${n.used_sermon.title}」` : ''}에서 썼어요
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

const Panel = ({ title, icon, hint, children }: { title: string; icon: string; hint?: string; children: ReactNode }) => (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4">
    <div className="flex items-center justify-between gap-2 mb-3">
      <h2 className="flex items-center gap-1.5 text-[13.5px] lg:text-[15px] font-bold text-ink-strong">
        <span className="material-icons-outlined text-[18px] text-brand">{icon}</span>
        {title}
      </h2>
      {hint && <span className="text-[12px] text-gray-500 dark:text-white/50">{hint}</span>}
    </div>
    {children}
  </div>
)

// ── 칸 하나의 원고 ─────────────────────────────────────────
const SectionManuscript = ({
  section,
  notes,
  onFocus,
  onChange,
}: {
  section: OutlineSection
  notes: SermonNote[]
  onFocus: () => void
  onChange: (v: string) => void
}) => {
  const value = section.manuscript ?? ''
  const ref = useRef<HTMLTextAreaElement>(null)
  const [caret, setCaret] = useState(0)
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)

  // 글 길이에 맞춰 늘어나는 칸 — 원고 전체를 한 번에 훑어 내려가며 쓸 수 있게
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 140)}px`
  }, [value])

  const slashMatch = useMemo(() => {
    if (!focused) return null
    const m = findSlashMatch(value, caret)
    return m && m.start !== dismissedAt ? m : null
  }, [value, caret, dismissedAt, focused])
  const slash = useVerseSlash(slashMatch?.query ?? null)

  const place = (next: string, pos: number) => {
    onChange(next.slice(0, MAX_LEN))
    setCaret(pos)
    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  // 말씀은 앞뒤를 빈 줄로 띄워 한 문단으로 넣는다 — 강단 보기에서 말씀 카드가 되게
  const insertVerse = () => {
    if (!slashMatch || slash?.kind !== 'ready') return
    const head = value.slice(0, slashMatch.start).replace(/[ \t]+$/, '')
    const tail = value.slice(caret).replace(/^[ \t]+/, '')
    const before = head ? (head.endsWith('\n\n') ? '' : head.endsWith('\n') ? '\n' : '\n\n') : ''
    const after = tail.startsWith('\n\n') ? '' : tail.startsWith('\n') ? '\n' : '\n\n'
    const piece = `${before}${slash.insert}${after}`
    place(head + piece + tail, head.length + piece.length)
  }

  const appendNote = (n: SermonNote) => {
    const body = n.source ? `${n.body.trim()} (${n.source})` : n.body.trim()
    const sep = value.trim() ? (value.endsWith('\n\n') ? '' : value.endsWith('\n') ? '\n' : '\n\n') : ''
    const next = `${value.trim() ? value : ''}${sep}${body}\n\n`
    place(next, next.length)
  }

  const chars = countChars(value)
  return (
    <section id={`ms-${section.id}`} className="scroll-mt-24">
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-[18px] lg:text-[21px] font-bold tracking-[-0.02em] text-ink-strong">{section.label}</h3>
        <span className="text-[12px] lg:text-[13px] text-gray-500 dark:text-white/50">{chars ? `${chars.toLocaleString()}자` : ''}</span>
      </div>
      {(section.text.trim() || notes.length > 0) && (
        <div className="mb-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-2.5 space-y-1.5">
          {section.text.trim() && (
            <p className="text-[13px] lg:text-[14px] leading-relaxed text-gray-600 dark:text-white/60 whitespace-pre-line">
              <b className="text-gray-500 dark:text-white/50 font-bold mr-1">개요</b>
              {section.text.trim()}
            </p>
          )}
          {notes.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {notes.map(n => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => appendNote(n)}
                    title="원고 끝에 넣기"
                    className="max-w-[260px] inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 text-[12px] lg:text-[13px] font-semibold text-gray-700 dark:text-white/70 hover:border-brand hover:text-brand"
                  >
                    <span className="material-icons-outlined text-[14px]">add</span>
                    <span className="truncate">{n.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <textarea
        ref={ref}
        value={value}
        maxLength={MAX_LEN}
        placeholder={`${section.label}에서 실제로 말할 글을 써 주세요. "/요 15:5" 처럼 치면 말씀을 넣을 수 있어요.`}
        onFocus={e => {
          setFocused(true)
          onFocus()
          setCaret(e.currentTarget.selectionStart ?? 0)
        }}
        onBlur={() => setFocused(false)}
        onChange={e => {
          onChange(e.target.value)
          setCaret(e.target.selectionStart ?? e.target.value.length)
        }}
        onSelect={e => setCaret(e.currentTarget.selectionStart ?? 0)}
        onKeyDown={e => {
          if (!slashMatch || e.nativeEvent.isComposing) return
          if (e.key === 'Escape') {
            e.preventDefault()
            setDismissedAt(slashMatch.start)
          } else if (e.key === 'Enter' && !e.shiftKey && slash?.kind === 'ready') {
            e.preventDefault()
            insertVerse()
          }
        }}
        className="w-full resize-none overflow-hidden bg-transparent rounded-xl px-1 py-1 text-[16px] lg:text-[17.5px] leading-[1.9] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none"
      />
      {slashMatch && slash && (
        <div className="mt-1">
          <VerseSlashPanel state={slash} ko onInsert={insertVerse} onDismiss={() => setDismissedAt(slashMatch.start)} />
        </div>
      )}
    </section>
  )
}

export default ManuscriptEditor
