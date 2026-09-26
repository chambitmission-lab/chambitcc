// 맞춤법 점검 결과 — 목록 패널(편지 정보 위)과, 본문 밑줄을 누르면 그 자리에 뜨는 카드.
// 고치기는 한 곳씩 확인하거나 "모두 고치기" 한 번으로. AI 제안이라 자동으로 바꾸지는 않는다.

import { useEffect, useLayoutEffect, useState } from 'react'
import type { ColumnProofreadIssue } from '../../types/column'
import { diffCore, type ProofIssue, type ProofreadFailure } from './columnProofread'

/** 제목 칸 제안은 문서 위치가 없어 key 만 붙여 같은 목록에 섞는다 */
export type PanelIssue = (ProofIssue | (ColumnProofreadIssue & { key: string })) & { inTitle?: boolean }

const KIND_LABEL = {
  spacing: ['띄어쓰기', 'Spacing'],
  spelling: ['맞춤법', 'Spelling'],
} as const

const kindColor = (kind: PanelIssue['kind']) => (kind === 'spacing' ? 'var(--brand)' : '#e5484d')

/** 원문·제안에서 달라진 가운데만 색으로 짚는다 — 띄어쓰기 한 칸도 눈에 보이게 */
const splitDiff = (a: string, b: string) => {
  const { p, s } = diffCore(a, b)
  return {
    head: a.slice(0, p),
    before: a.slice(p, a.length - s),
    after: b.slice(p, b.length - s),
    tail: a.slice(a.length - s),
  }
}

const isBlank = (t: string) => t.length > 0 && !t.trim()

/** 띄어쓰기 제안이 붙이는 쪽인지 띄우는 쪽인지 — 목록에서 말로 한 번 더 알려 준다 */
const spacingAction = (issue: PanelIssue, ko: boolean): string | null => {
  if (issue.kind !== 'spacing') return null
  const { before, after } = splitDiff(issue.original, issue.suggestion)
  if (isBlank(before) && !after) return ko ? '붙여 쓰기' : 'Join'
  if (!before && isBlank(after)) return ko ? '띄어 쓰기' : 'Split'
  return null
}

/** 빈칸 자체를 보여 주는 네모 — 취소선을 그으면 "-" 처럼 보여 오해를 산다 */
const Gap = ({ tone }: { tone: 'remove' | 'add' }) => (
  <span
    className={`inline-block w-[0.55em] h-[1.05em] align-[-0.15em] rounded-[3px] mx-[1px] ${
      tone === 'remove' ? 'bg-red-500/25 ring-1 ring-red-500/40' : 'bg-emerald-500/25 ring-1 ring-emerald-500/50'
    }`}
  ></span>
)

const DiffLine = ({ issue, large = false }: { issue: PanelIssue; large?: boolean }) => {
  const { head, before, after, tail } = splitDiff(issue.original, issue.suggestion)
  const mark = 'rounded-[3px] px-[1px] whitespace-pre'
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 leading-[1.5] ${large ? 'text-[17px] lg:text-[19px]' : 'text-[15px] lg:text-[17px]'}`}>
      <span className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
        {head}
        {isBlank(before) ? (
          <Gap tone="remove" />
        ) : (
          before && <span className={`${mark} line-through decoration-2 bg-red-500/10 text-red-600 dark:text-red-400`}>{before}</span>
        )}
        {tail}
      </span>
      <span className="text-gray-400" aria-hidden="true">→</span>
      <span className="font-bold text-ink-strong whitespace-pre-wrap">
        {head}
        {isBlank(after) ? (
          <Gap tone="add" />
        ) : (
          after && (
            <span className={`${mark} bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 underline decoration-2 underline-offset-4`}>{after}</span>
          )
        )}
        {tail}
      </span>
    </p>
  )
}

interface ProofreadPanelProps {
  ko: boolean
  issues: PanelIssue[]
  onFocus: (issue: PanelIssue) => void
  onFix: (issue: PanelIssue) => void
  onIgnore: (issue: PanelIssue) => void
  onFixAll: () => void
  onRecheck: () => void
  onClose: () => void
  checking: boolean
}

export const ProofreadPanel = ({ ko, issues, onFocus, onFix, onIgnore, onFixAll, onRecheck, onClose, checking }: ProofreadPanelProps) => {
  const spacing = issues.filter((i) => i.kind === 'spacing').length
  const spelling = issues.length - spacing
  const btn = 'px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-[13px] lg:text-[14px] font-semibold transition-colors'

  return (
    <section
      className="mx-5 mt-5 lg:mx-7 lg:mt-7 rounded-2xl border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-4 lg:px-5 py-4"
      aria-label={ko ? '맞춤법 점검 결과' : 'Spelling check results'}
    >
      <div className="flex items-center gap-2">
        <p className="flex-1 text-[15px] lg:text-[17px] font-bold text-ink-strong">
          {ko ? '맞춤법 점검' : 'Spelling check'}
          {issues.length > 0 && <span className="ml-1.5 text-[var(--brand)] tabular-nums">{issues.length}</span>}
        </p>
        <button type="button" onClick={onClose} className="text-[13px] lg:text-[14px] font-semibold text-gray-500 dark:text-gray-400 hover:text-ink-strong px-1.5 py-1">
          {ko ? '닫기' : 'Close'}
        </button>
      </div>

      {issues.length > 0 ? (
        <>
          <p className="mt-1 text-[12.5px] lg:text-[14px] text-gray-600 dark:text-gray-300 flex items-center gap-3">
            {spelling > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: kindColor('spelling') }}></span>
                {ko ? `맞춤법 ${spelling}` : `Spelling ${spelling}`}
              </span>
            )}
            {spacing > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: kindColor('spacing') }}></span>
                {ko ? `띄어쓰기 ${spacing}` : `Spacing ${spacing}`}
              </span>
            )}
          </p>

          <button
            type="button"
            onClick={onFixAll}
            className="mt-3 w-full py-2.5 lg:py-3 rounded-xl bg-[var(--brand)] text-white text-[14px] lg:text-[16px] font-bold shadow-[0_2px_8px_var(--brand-glow)]"
          >
            {ko ? `${issues.length}곳 모두 고치기` : `Fix all ${issues.length}`}
          </button>

          <ul className="mt-3 space-y-2">
            {issues.map((issue) => {
              const action = spacingAction(issue, ko)
              return (
              <li key={issue.key} className="rounded-xl bg-[var(--surface-container)] border border-border-light dark:border-white/[0.08] px-3.5 py-3">
                <button type="button" onClick={() => onFocus(issue)} className="block w-full text-left" title={ko ? '본문에서 보기' : 'Show in letter'}>
                  <span className="flex items-center gap-1.5 text-[11.5px] lg:text-[13px] font-semibold" style={{ color: kindColor(issue.kind) }}>
                    {KIND_LABEL[issue.kind][ko ? 0 : 1]}
                    {action && <span>· {action}</span>}
                    {issue.inTitle && <span className="text-gray-500 dark:text-gray-400">· {ko ? '제목' : 'Title'}</span>}
                  </span>
                  <span className="block mt-1">
                    <DiffLine issue={issue} />
                  </span>
                  {issue.reason && <span className="block mt-1 text-[12.5px] lg:text-[14px] text-gray-500 dark:text-gray-400">{issue.reason}</span>}
                </button>
                <div className="mt-2.5 flex gap-2">
                  <button type="button" onClick={() => onFix(issue)} className={`${btn} bg-[var(--brand)] text-white`}>
                    {ko ? '고치기' : 'Fix'}
                  </button>
                  <button type="button" onClick={() => onIgnore(issue)} className={`${btn} text-gray-600 dark:text-gray-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]`}>
                    {ko ? '그대로 두기' : 'Ignore'}
                  </button>
                </div>
              </li>
              )
            })}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-[14px] lg:text-[16px] text-gray-600 dark:text-gray-300 leading-[1.6]">
          {ko ? '고칠 곳을 모두 확인했어요.' : 'All suggestions reviewed.'}
        </p>
      )}

      <div className="mt-3 flex items-start gap-2">
        <p className="flex-1 text-[12px] lg:text-[13px] leading-[1.55] text-gray-500 dark:text-gray-400">
          {ko
            ? 'AI 제안이라 틀릴 수 있어요. 인용 상자와 “말씀” 인용은 점검하지 않습니다. 고친 뒤에도 되돌리기로 원래대로 돌릴 수 있어요.'
            : 'AI suggestions may be wrong. Quotes are skipped. Undo restores any fix.'}
        </p>
        <button type="button" onClick={onRecheck} disabled={checking} className="flex-shrink-0 text-[12.5px] lg:text-[14px] font-semibold text-[var(--brand)] disabled:opacity-50 px-1 py-0.5">
          {checking ? (ko ? '점검 중…' : 'Checking…') : ko ? '다시 점검' : 'Recheck'}
        </button>
      </div>
    </section>
  )
}

const FAILURE_TEXT: Record<ProofreadFailure, [string, string]> = {
  limit: [
    'AI 맞춤법 점검의 무료 사용량이 잠시 다 찼어요. 몇 분 뒤에 다시 눌러 주세요. 계속 안 되면 오늘 사용량이 끝난 것이니 내일 다시 점검해 주세요.',
    'The free AI quota is used up for now. Try again in a few minutes, or tomorrow if it keeps failing.',
  ],
  timeout: ['점검 응답이 너무 늦어 멈췄어요. 잠시 후 다시 시도해 주세요.', 'The check took too long. Please try again shortly.'],
  network: ['인터넷 연결이 끊긴 것 같아요. 연결을 확인한 뒤 다시 시도해 주세요.', 'You seem to be offline. Check your connection and try again.'],
  failed: ['점검하는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.', 'Something went wrong while checking. Please try again shortly.'],
}

interface ProofreadNoticeProps {
  ko: boolean
  failure: ProofreadFailure
  onRetry: () => void
  onClose: () => void
  checking: boolean
}

/** 점검을 못 했을 때 — 토스트는 금방 사라지므로 편지 정보 위에 남겨 두고, 저장은 그대로 된다고 안심시킨다 */
export const ProofreadNotice = ({ ko, failure, onRetry, onClose, checking }: ProofreadNoticeProps) => (
  <section
    role="alert"
    className="mx-5 mt-5 lg:mx-7 lg:mt-7 rounded-2xl border border-amber-500/35 bg-amber-500/[0.08] px-4 lg:px-5 py-4"
  >
    <div className="flex items-start gap-2.5">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">
        <path d="M10 3.2L18 16.5H2z" />
        <path d="M10 8.2v3.8M10 14.3h.01" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] lg:text-[17px] font-bold text-ink-strong">
          {ko ? '지금은 맞춤법 점검을 할 수 없어요' : 'Spelling check is unavailable right now'}
        </p>
        <p className="mt-1.5 text-[13.5px] lg:text-[15px] leading-[1.6] text-gray-700 dark:text-gray-300">{FAILURE_TEXT[failure][ko ? 0 : 1]}</p>
        <p className="mt-1.5 text-[12.5px] lg:text-[14px] leading-[1.55] text-gray-500 dark:text-gray-400">
          {ko ? '편지 작성과 저장은 그대로 하실 수 있어요.' : 'You can still write and save your letter.'}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            disabled={checking}
            className="px-3.5 lg:px-4 py-2 lg:py-2.5 rounded-xl bg-[var(--brand)] text-white text-[13px] lg:text-[15px] font-bold disabled:opacity-60"
          >
            {checking ? (ko ? '점검 중…' : 'Checking…') : ko ? '다시 시도' : 'Try again'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-[13px] lg:text-[15px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
          >
            {ko ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  </section>
)

const CARD_W = 360

interface ProofIssueCardProps {
  ko: boolean
  issue: PanelIssue
  /** 밑줄 요소를 찾을 편집기 DOM */
  root: HTMLElement
  onFix: () => void
  onIgnore: () => void
  onClose: () => void
}

type Anchor = { left: number; top: number; bottom: number }
const sameAnchor = (a: Anchor | null, b: Anchor | null) => !!a && !!b && a.left === b.left && a.top === b.top && a.bottom === b.bottom

/** 본문 밑줄을 누르면 그 바로 아래에 — 고치기 / 그대로 두기 */
export const ProofIssueCard = ({ ko, issue, root, onFix, onIgnore, onClose }: ProofIssueCardProps) => {
  // 편지지가 스크롤되면 카드도 따라간다 — 좌표는 렌더 밖(레이아웃 효과)에서 재고, 스크롤은 한 프레임에 한 번만 잰다
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  useLayoutEffect(() => {
    const measure = () => {
      const rect = root.querySelector(`[data-proof="${issue.key}"]`)?.getBoundingClientRect()
      const next = rect ? { left: rect.left, top: rect.top, bottom: rect.bottom } : null
      setAnchor((prev) => (sameAnchor(prev, next) ? prev : next))
    }
    measure()
    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        measure()
      })
    }
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [issue, root])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!anchor) return null
  const left = Math.max(16, Math.min(anchor.left, window.innerWidth - CARD_W - 16))
  const below = anchor.bottom + 10
  const placeAbove = below + 200 > window.innerHeight
  const style = placeAbove ? { left, bottom: window.innerHeight - anchor.top + 10, width: CARD_W } : { left, top: below, width: CARD_W }
  const action = spacingAction(issue, ko)

  return (
    <div
      className="fixed z-[125] max-w-[calc(100vw-32px)] rounded-2xl border border-border-light dark:border-white/[0.1] bg-[var(--surface-container)] shadow-[0_16px_40px_rgba(15,23,42,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)] p-4"
      style={style}
      // 버튼을 눌러도 편집기 커서를 잃지 않게
      onMouseDown={(e) => e.preventDefault()}
      role="dialog"
      aria-label={ko ? '맞춤법 제안' : 'Spelling suggestion'}
    >
      <p className="text-[13px] lg:text-[14px] font-bold" style={{ color: kindColor(issue.kind) }}>
        {KIND_LABEL[issue.kind][ko ? 0 : 1]}
        {action && ` · ${action}`}
      </p>
      <div className="mt-1.5">
        <DiffLine issue={issue} large />
      </div>
      {issue.reason && <p className="mt-1 text-[13px] lg:text-[14px] text-gray-500 dark:text-gray-400">{issue.reason}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onFix} className="flex-1 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[14px] lg:text-[15px] font-bold">
          {ko ? '고치기' : 'Fix'}
        </button>
        <button
          type="button"
          onClick={onIgnore}
          className="flex-1 py-2.5 rounded-xl bg-surface-light dark:bg-white/[0.06] text-ink-strong text-[14px] lg:text-[15px] font-semibold"
        >
          {ko ? '그대로 두기' : 'Ignore'}
        </button>
      </div>
    </div>
  )
}
