// 설교 준비실 가운데 단 — 단계별 작업면
//   ① 본문(StepPassage) · ③ 뼈대(StepSkeleton) · ⑤ 점검(StepReview) · ⑥ 강단과 나눔(StepPulpit).
//   ② 연구·④ 원고는 기존 카드(SermonBriefCard·SermonBridgeCard·ManuscriptEditor)를 PastorStudioRoom 이 그대로 쓴다.
import { useMemo, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { OutlineSection, SermonStudy } from '../../../../api/pastor'
import DatePicker from '../../../../components/common/DatePicker'
import { useAutoGrow } from '../../../../hooks/useAutoGrow'
import { confirmDialog } from '../../../../utils/confirmDialog'
import { IconButton } from '../sermonNotes'
import ManuscriptReviewPanel from '../ManuscriptReviewPanel'
import WeekPackEditor from '../WeekPackEditor'
import { checkManuscript, countChars, estimateMinutes, pendingDraftsOf, quotedVerses, sectionBody, usePace } from '../manuscript'
import { formatDay, inputCls, pickerCls } from '../pastorUtils'
import type { OutlineDraft } from '../useOutlineDraft'
import { pendingDraftCount } from './studio'

export const StudioCard = ({
  title,
  icon,
  hint,
  action,
  children,
}: {
  title: string
  icon: string
  hint?: string
  action?: ReactNode
  children: ReactNode
}) => (
  <section className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4 lg:p-5 space-y-3">
    <div className="flex items-center gap-2">
      <span className="material-icons-outlined text-[20px] text-brand">{icon}</span>
      <h2 className="text-[15.5px] lg:text-[17px] font-bold tracking-[-0.015em] text-ink-strong">{title}</h2>
      {hint && <span className="text-[12px] text-gray-500 dark:text-white/50">{hint}</span>}
      {action && <span className="ml-auto">{action}</span>}
    </div>
    {children}
  </section>
)

// ── ① 본문 ───────────────────────────────────────────────
export const StepPassage = ({
  draft,
  study,
  studyPending,
  onEdit,
}: {
  draft: OutlineDraft
  study: SermonStudy | undefined
  studyPending: boolean
  onEdit: (patch: Partial<OutlineDraft>) => void
}) => {
  const found = study?.found && study.verses && study.verses.length > 0
  return (
    <div className="space-y-4">
      <StudioCard title="이번 설교" icon="flag">
        <input
          className={`${inputCls} text-[17px] lg:text-[19px] font-bold`}
          value={draft.title}
          maxLength={200}
          placeholder="설교 제목 (나중에 정해도 됩니다)"
          onChange={e => onEdit({ title: e.target.value })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            className={`${inputCls} lg:text-[16px]`}
            value={draft.passage}
            maxLength={100}
            placeholder="본문 — 예: 요 15:1-8"
            onChange={e => onEdit({ passage: e.target.value })}
          />
          <DatePicker value={draft.preach_on} onChange={v => onEdit({ preach_on: v })} placeholder="설교할 날" className={pickerCls} />
        </div>
      </StudioCard>

      {!draft.passage.trim() ? (
        <p className="px-2 py-10 text-center text-[14px] text-gray-600 dark:text-white/60">본문을 적으면 말씀과 함께 준비를 시작합니다.</p>
      ) : studyPending && !study ? (
        <p className="px-2 py-10 text-center text-[14px] text-gray-600 dark:text-white/60">말씀을 펼치는 중…</p>
      ) : !found ? (
        <p className="px-2 py-10 text-center text-[14px] text-gray-600 dark:text-white/60">본문을 찾지 못했습니다. '요 15:1-8'처럼 적어 주세요.</p>
      ) : (
        <>
          <StudioCard
            title={study.label ?? draft.passage}
            icon="menu_book"
            hint="개역개정"
            action={
              <Link
                to={`/pastor/sermon/study?ref=${encodeURIComponent(study.label ?? draft.passage)}`}
                className="inline-flex items-center gap-0.5 text-[12.5px] lg:text-[13.5px] font-semibold text-gray-600 dark:text-white/60 hover:text-brand"
              >
                본문 작업대<span className="material-icons-outlined text-[16px]">open_in_new</span>
              </Link>
            }
          >
            {study.clipped && <p className="text-[12.5px] text-gray-500 dark:text-white/50">본문이 길어 앞부분 60절만 보여 드립니다.</p>}
            <ol className="space-y-2">
              {study.verses!.map(v => (
                <li key={v.id} className="flex gap-2.5 text-[16px] lg:text-[17.5px] leading-[1.9] text-ink-strong">
                  <sup className="mt-[0.7em] shrink-0 w-6 text-right text-[12px] font-bold text-brand">{v.verse_label ?? v.verse}</sup>
                  <span>{v.text}</span>
                </li>
              ))}
            </ol>
            {study.keywords && study.keywords.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-gray-100 dark:border-white/[0.06]">
                <span className="text-[12px] font-bold text-gray-500 dark:text-white/50 mr-0.5">되풀이되는 말</span>
                {study.keywords.slice(0, 8).map(k => (
                  <span key={k.word} className="px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] font-semibold">
                    {k.word} <span className="opacity-70">{k.count}</span>
                  </span>
                ))}
              </div>
            )}
          </StudioCard>

          {study.book_intro && (
            <StudioCard title={`${study.book_name ?? ''} 한눈에`} icon="travel_explore">
              <p className="text-[14px] lg:text-[15px] font-semibold text-ink-strong leading-relaxed">{study.book_intro.one_liner}</p>
              {study.book_intro.christ_connection && (
                <p className="text-[13.5px] lg:text-[14.5px] leading-relaxed text-gray-700 dark:text-white/70">
                  <b className="text-brand mr-1">구속사 흐름</b>
                  {study.book_intro.christ_connection}
                </p>
              )}
            </StudioCard>
          )}

          {study.past_sermons && study.past_sermons.length > 0 && (
            <div className="rounded-2xl px-4 py-3 bg-amber-50 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/25">
              <p className="flex items-center gap-1 text-[13.5px] lg:text-[14.5px] font-bold text-amber-800 dark:text-amber-300">
                <span className="material-icons-outlined text-[17px]">history</span>이 본문으로 전에 하신 설교
              </p>
              <ul className="mt-1 space-y-0.5">
                {study.past_sermons.slice(0, 4).map(s => (
                  <li key={s.id} className="text-[13px] lg:text-[14px] text-amber-900/85 dark:text-amber-200/85">
                    {formatDay(s.date, false)} 「{s.title}」{s.bible_verse ? ` · ${s.bible_verse}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── ③ 뼈대 ───────────────────────────────────────────────
const newSectionId = () => `s${Date.now().toString(36)}`

/** 글 길이에 맞춰 늘어나는 입력칸 — 테두리 없이 카드 위에 바로 쓴다. singleLine 은 엔터·줄바꿈을 막는다(칸 이름) */
const AutoGrowText = ({
  value,
  onChange,
  className = '',
  placeholder,
  maxLength,
  minRows = 1,
  singleLine = false,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
  maxLength?: number
  minRows?: number
  singleLine?: boolean
  'aria-label'?: string
}) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  useAutoGrow(ref, value)
  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={e => onChange(singleLine ? e.target.value.replace(/\s*\n\s*/g, ' ') : e.target.value)}
      onKeyDown={singleLine ? e => e.key === 'Enter' && e.preventDefault() : undefined}
      className={`resize-none overflow-hidden bg-transparent p-0 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none ${className}`}
    />
  )
}

export const StepSkeleton = ({
  sections,
  onChange,
  outlineId,
}: {
  sections: OutlineSection[]
  onChange: (fn: (s: OutlineSection[]) => OutlineSection[]) => void
  outlineId: number
}) => {
  const move = (i: number, dir: -1 | 1) =>
    onChange(list => {
      const t = i + dir
      if (t < 0 || t >= list.length) return list
      const next = [...list]
      ;[next[i], next[t]] = [next[t], next[i]]
      return next
    })
  return (
    <StudioCard
      title="지금 뼈대"
      icon="view_agenda"
      hint={`${sections.length}칸`}
      action={
        <Link
          to={`/pastor/sermon/outlines/${outlineId}`}
          className="inline-flex items-center gap-0.5 text-[12.5px] lg:text-[13.5px] font-semibold text-gray-600 dark:text-white/60 hover:text-brand"
        >
          메모 배치는 개요 보드에서<span className="material-icons-outlined text-[16px]">open_in_new</span>
        </Link>
      }
    >
      <ol className="space-y-2.5">
        {sections.map((s, i) => (
          <li
            key={s.id}
            className="rounded-2xl border border-gray-200/80 dark:border-white/[0.08] px-4 py-3.5 space-y-1.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-brand text-white text-[12px] font-bold flex items-center justify-center">{i + 1}</span>
              {/* 긴 대지 제목도 잘리지 않게 줄바꿈되는 칸(엔터로 줄을 나누지는 않는다) */}
              <AutoGrowText
                className="flex-1 min-w-0 text-[16px] lg:text-[17px] font-bold leading-snug text-ink-strong"
                value={s.label}
                maxLength={30}
                aria-label="칸 이름"
                singleLine
                onChange={v => onChange(list => list.map(x => (x.id === s.id ? { ...x, label: v } : x)))}
              />
              <span className="shrink-0 flex items-center -mt-1 -mr-1">
              <IconButton icon="arrow_upward" label="칸 위로" disabled={i === 0} onClick={() => move(i, -1)} />
              <IconButton icon="arrow_downward" label="칸 아래로" disabled={i === sections.length - 1} onClick={() => move(i, 1)} />
              <IconButton
                icon="close"
                label="칸 지우기"
                danger
                disabled={sections.length <= 1}
                onClick={async () => {
                  if (
                    (s.text.trim() || s.manuscript?.trim() || s.note_ids.length) &&
                    !(await confirmDialog({ title: '칸 지우기', message: `'${s.label}' 칸의 글·원고와 메모 배치를 지울까요?`, confirmText: '지우기' }))
                  )
                    return
                  onChange(list => list.filter(x => x.id !== s.id))
                }}
              />
              </span>
            </div>
            {/* 요지 — 글 길이만큼 늘어난다(안쪽 스크롤 없이 전체를 보며 고친다) */}
            <AutoGrowText
              className="block w-full pl-8 text-[15px] lg:text-[16px] leading-[1.8] text-gray-800 dark:text-white/85"
              value={s.text}
              maxLength={6000}
              placeholder={`${s.label}에서 전할 요지`}
              minRows={2}
              onChange={v => onChange(list => list.map(x => (x.id === s.id ? { ...x, text: v } : x)))}
            />
            {(s.manuscript?.trim() || s.note_ids.length > 0) && (
              <p className="pl-8 text-[12px] text-gray-500 dark:text-white/50">
                {[s.manuscript?.trim() ? `원고 ${countChars(s.manuscript).toLocaleString()}자` : null, s.note_ids.length ? `메모 ${s.note_ids.length}개` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={sections.length >= 12}
        onClick={() => onChange(list => [...list, { id: newSectionId(), label: '새 칸', text: '', manuscript: '', note_ids: [] }])}
        className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.15] text-[13px] lg:text-[14px] font-semibold text-gray-600 dark:text-white/65 hover:border-brand hover:text-brand disabled:opacity-40"
      >
        + 칸 추가 (예: 본론 2, 예화, 기도)
      </button>
    </StudioCard>
  )
}

// ── ⑤ 점검 ───────────────────────────────────────────────
export const StepReview = ({
  outlineId,
  sections,
  flush,
  onJump,
}: {
  outlineId: number
  sections: OutlineSection[]
  flush: () => Promise<unknown>
  /** 고치지 않은 AI 초안이 있는 칸으로 — 원고 단계로 간다 */
  onJump: (sectionId: string) => void
}) => {
  const [, , perMin] = usePace()
  const checks = useMemo(() => checkManuscript(sections, perMin), [sections, perMin])
  const quotes = useMemo(() => quotedVerses(sections), [sections])
  const total = sections.reduce((n, s) => n + countChars(sectionBody(s)), 0)
  const drafts = sections.map(s => ({ s, n: pendingDraftsOf(s).length })).filter(x => x.n > 0)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
      <div className="space-y-4 min-w-0">
        <StudioCard title="원고 한눈에" icon="timer" hint={`${total.toLocaleString()}자 · 예상 ${estimateMinutes(total, perMin)}분`}>
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
        </StudioCard>

        <StudioCard title="AI 초안 남은 곳" icon="auto_awesome" hint="목사님의 말로 고쳐 쓰셨는지">
          {drafts.length === 0 ? (
            <p className="flex items-center gap-1.5 text-[13.5px] lg:text-[14.5px] font-semibold text-brand">
              <span className="material-icons-outlined text-[18px]">verified</span>
              원고에 고치지 않은 AI 초안이 없습니다
            </p>
          ) : (
            <ul className="space-y-1.5">
              {drafts.map(({ s, n }) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onJump(s.id)}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 bg-[var(--brand-soft)] border border-dashed border-brand/40 text-left hover:border-brand"
                  >
                    <span className="flex-1 min-w-0 truncate text-[13.5px] lg:text-[14.5px] font-bold text-ink-strong">「{s.label}」</span>
                    <span className="text-[12.5px] font-semibold text-brand whitespace-nowrap">{n}문단 · 고치러 가기</span>
                    <span className="material-icons-outlined text-[17px] text-brand">chevron_right</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </StudioCard>

        {quotes.length > 0 && (
          <StudioCard title="인용한 말씀" icon="format_quote">
            <div className="flex flex-wrap gap-1.5">
              {quotes.map(q => (
                <span key={q} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.07] text-[12.5px] lg:text-[13.5px] font-semibold text-gray-700 dark:text-white/75">
                  {q}
                </span>
              ))}
            </div>
          </StudioCard>
        )}
      </div>
      <div className="min-w-0">
        <ManuscriptReviewPanel outlineId={outlineId} sections={sections} flush={flush} />
      </div>
    </div>
  )
}

// ── ⑥ 강단과 나눔 ─────────────────────────────────────────
export const StepPulpit = ({
  outlineId,
  sections,
  status,
  flush,
}: {
  outlineId: number
  sections: OutlineSection[]
  status: 'draft' | 'done'
  flush: () => Promise<unknown>
}) => {
  const pending = pendingDraftCount(sections)
  return (
    <div>
      <div className="px-4 pt-4">
      <div className="relative overflow-hidden rounded-3xl bg-ink-strong text-white dark:bg-[#1b2433] p-5 lg:p-6">
        <div aria-hidden className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-brand/40 blur-3xl" />
        <div className="relative space-y-3">
          <p className="text-[12px] font-bold tracking-[0.08em] text-white/60">PULPIT</p>
          <h2 className="text-[20px] lg:text-[24px] font-bold tracking-[-0.02em]">강단에 서기 전</h2>
          <p className="text-[13.5px] lg:text-[15px] leading-relaxed text-white/75">
            원고를 큰 글씨로 한 장씩 넘겨 봅니다. 태블릿에서 열면 화면이 꺼지지 않고, 말씀 인용은 말씀 카드로 보입니다.
          </p>
          {pending > 0 && (
            <p className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-white/10 text-[13px] lg:text-[14px]">
              <span className="material-icons-outlined text-[17px]">auto_awesome</span>
              아직 고치지 않은 AI 초안 {pending}문단이 있습니다. 점검 단계에서 확인해 주세요.
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to={`/pastor/sermon/outlines/${outlineId}/pulpit`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white text-ink-strong text-[14px] lg:text-[15px] font-bold"
            >
              <span className="material-icons-outlined text-[18px]">menu_book</span>강단 보기
            </Link>
            <Link
              to={`/pastor/sermon/outlines/${outlineId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/30 text-white text-[14px] lg:text-[15px] font-semibold hover:bg-white/10"
            >
              <span className="material-icons-outlined text-[18px]">print</span>
              {status === 'done' ? '개요 보드에서 보기' : '인쇄·설교 마침은 개요 보드에서'}
            </Link>
          </div>
        </div>
      </div>
      </div>
      <WeekPackEditor outlineId={outlineId} flush={flush} />
    </div>
  )
}
