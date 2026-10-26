// 필사대회 화면 공통 값 — 단계 문구·날짜·메달 색 (컴포넌트는 contestShared.tsx)
import type { ContestPhase, ContestSummary } from '../../types/handwritingContest'

const KST_DATE = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })
const KST_DATE_TIME = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export const formatDay = (iso: string) => KST_DATE.format(new Date(iso))
export const formatDayTime = (iso: string) => KST_DATE_TIME.format(new Date(iso))

const kstDay = (ms: number) => Math.floor((ms + 9 * 3_600_000) / 86_400_000)

/** 마감까지 남은 날(KST 달력 기준, 오늘 마감이면 0). 자정 마감은 전날이 마지막 날이다 */
export const daysUntil = (iso: string): number =>
  Math.max(0, kstDay(new Date(iso).getTime() - 1) - kstDay(Date.now()))

export const PHASE_META: Record<ContestPhase, { label: string; cls: string }> = {
  upcoming: {
    label: '시작 전',
    cls: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/[0.06] dark:text-white/60 dark:border-white/[0.08]',
  },
  open: { label: '진행 중', cls: 'bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)]' },
  closed: {
    label: '집계 중',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  },
  announced: {
    label: '발표',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
  },
}

export const periodText = (c: Pick<ContestSummary, 'starts_at' | 'ends_at'>) =>
  `${formatDay(c.starts_at)} ~ ${formatDay(c.ends_at)}`

/** 단계별 한 줄 안내 — 히어로 아래 */
export const phaseLine = (c: ContestSummary): string => {
  switch (c.phase) {
    case 'upcoming':
      return `${formatDayTime(c.starts_at)}에 시작해요`
    case 'open': {
      const left = daysUntil(c.ends_at)
      return left === 0 ? '오늘 마감이에요' : `마감까지 ${left}일 남았어요`
    }
    case 'closed':
      return '마감됐어요 · 결과 발표를 기다려 주세요'
    case 'announced':
      return '결과가 발표됐어요'
  }
}

export const RANK_META: Record<number, { label: string; medal: string; ring: string }> = {
  1: { label: '1등', medal: '#d9a441', ring: 'ring-[#d9a441]/60' },
  2: { label: '2등', medal: '#9aa4b2', ring: 'ring-[#9aa4b2]/60' },
  3: { label: '3등', medal: '#b9825a', ring: 'ring-[#b9825a]/60' },
}

export const errorText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback)
