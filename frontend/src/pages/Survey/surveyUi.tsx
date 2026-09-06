// 설문 화면 공통 UI — 목록·상세가 같은 껍데기(셸·헤더·칩·빈 상태)를 쓴다.
// 앱의 다른 목록/상세 화면(/classes·/bible/plans)과 같은 문법을 그대로 따른다:
// 캔버스 바탕 + sticky 상단 바 + 흰 카드, lg+ 에서는 본문 + 312px 우측 레일 2단.
import type { ReactNode } from 'react'
import type { SurveySummary } from '../../types/survey'
import { STATUS_META, daysLeft, isAcceptingResponses } from './surveyShared'

export const ChevronLeft = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

export const ChevronRight = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18" />
  </svg>
)

export const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

/** 설문지 한 장 — 목록 카드·히어로·홈 배너가 함께 쓰는 상징 */
export const ClipboardIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4H6.5A1.5 1.5 0 0 0 5 5.5v14A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 17.5 4H16" />
    <rect x="8" y="2.6" width="8" height="3.2" rx="1.1" />
    <polyline points="9.2 12 10.8 13.6 14.8 9.6" />
    <path d="M9.2 17.4h5.6" />
  </svg>
)

export const Spinner = ({ size = 32 }: { size?: number }) => (
  <div className="flex justify-center py-14">
    <div
      style={{ width: size, height: size }}
      className="border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin"
    />
  </div>
)

/** 페이지 셸 — rail 을 주면 lg+ 에서 2단이 된다 (없으면 읽기 좋은 폭으로 가운데 정렬) */
export const SurveyShell = ({
  onBack,
  title,
  rail,
  children,
}: {
  onBack: () => void
  title: ReactNode
  rail?: ReactNode
  children: ReactNode
}) => (
  <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
    <div
      className={
        rail
          ? 'lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12'
          : 'lg:max-w-[1240px] lg:mx-auto lg:flex lg:justify-center lg:px-5 lg:pt-3 lg:pb-12'
      }
    >
      <div
        className={`max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark ${
          rail ? 'lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0' : 'lg:max-w-[760px] lg:mx-0'
        }`}
      >
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2 lg:rounded-t-3xl">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            aria-label="뒤로"
          >
            <ChevronLeft />
          </button>
          <h1 className="flex-1 min-w-0 text-base font-bold tracking-[-0.015em] text-ink-strong truncate">
            {title}
          </h1>
        </div>
        {children}
      </div>

      {rail ? (
        <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
          {rail}
        </aside>
      ) : null}
    </div>
  </div>
)

export const SectionTitle = ({ children, count }: { children: ReactNode; count?: number }) => (
  <div className="flex items-center gap-1.5 px-0.5 mb-3">
    <h2 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em]">{children}</h2>
    {typeof count === 'number' ? (
      <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold bg-[var(--brand-soft)] text-brand tabular-nums">
        {count}
      </span>
    ) : null}
  </div>
)

/** 레일 위젯 한 칸 */
export const RailCard = ({ title, children }: { title?: string; children: ReactNode }) => (
  <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
    {title ? (
      <p className="mb-2.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
        {title}
      </p>
    ) : null}
    {children}
  </section>
)

/** 안내 화면 — 로그인 필요·없는 설문처럼 본문 대신 한 장만 뜨는 자리 */
export const CenterNote = ({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string
  hint?: string
  actionLabel?: string
  onAction?: () => void
}) => (
  <div className="px-4 pt-10 pb-16 text-center">
    <span className="mx-auto mb-3 flex w-12 h-12 rounded-2xl bg-[var(--brand-soft)] text-brand items-center justify-center">
      <ClipboardIcon size={24} />
    </span>
    <p className="text-[15px] font-bold text-ink-strong">{title}</p>
    {hint ? <p className="mt-1.5 text-[13px] text-ink-muted leading-relaxed">{hint}</p> : null}
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="relative mt-4 px-5 py-2.5 rounded-2xl bg-brand text-white text-[14px] font-bold seal-chip [--seal-radius:1rem] [--seal-drop:0_10px_30px_-8px_var(--brand-glow)]"
      >
        {actionLabel}
      </button>
    ) : null}
  </div>
)

// ── 칩 ────────────────────────────────────────────────────────────────
// 한 카드에 여러 색 배지가 겹치지 않도록 "지금 알아야 할 것" 하나만 남긴다.

const chipCls = 'inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border leading-[1.5]'

export const DeadlineChip = ({ endsAt }: { endsAt?: string | null }) => {
  const left = daysLeft(endsAt)
  if (left === null || left < 0) return null
  const urgent = left <= 2
  return (
    <span
      className={`${chipCls} ${
        urgent
          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25'
          : 'bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)]'
      }`}
    >
      {left === 0 ? '오늘 마감' : `D-${left}`}
    </span>
  )
}

export const DoneChip = () => (
  <span className={`${chipCls} bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25`}>
    <CheckIcon size={11} />
    참여 완료
  </span>
)

export const StatusChip = ({ status }: { status: SurveySummary['status'] }) => (
  <span className={`${chipCls} ${STATUS_META[status].badge}`}>{STATUS_META[status].label}</span>
)

/**
 * 카드 한 장이 지금 무슨 상태인지 — 칩은 하나만.
 * 진행 중이면 마감이, 끝났으면 마감 배지가, 이미 냈으면 참여 완료가 이긴다.
 */
export const SurveyStateChip = ({ survey }: { survey: SurveySummary }) => {
  if (survey.my_response_id) return <DoneChip />
  if (isAcceptingResponses(survey)) return <DeadlineChip endsAt={survey.ends_at} />
  return <StatusChip status={survey.status} />
}
