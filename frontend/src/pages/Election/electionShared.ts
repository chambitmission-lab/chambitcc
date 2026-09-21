// 선거 화면 공통 — 상태 문구·당선 기준 문장·기준 프리셋
//
// 기준의 "값"은 서버(services/election_rules.py)가 정한다. 여기는 그 값을 사람 말로
// 옮기고, 관리 화면에서 고르기 쉬운 프리셋을 늘어놓을 뿐이다.
import type {
  ElectionRules,
  ElectionStatus,
  ElectionSummary,
  ResultVisibility,
  RunoffRule,
} from '../../types/election'

export const STATUS_META: Record<ElectionStatus, { label: string; badge: string }> = {
  draft: {
    label: '준비 중',
    badge:
      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/45 dark:border-white/[0.08]',
  },
  active: {
    label: '진행 중',
    badge: 'bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)]',
  },
  finished: {
    label: '종료',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  },
}

/** 목록·배너에 쓰는 "지금 단계" 한 줄 — 1차 투표 중 / 2차 준비 중 / 종료 */
export const phaseLabel = (e: ElectionSummary): string => {
  if (e.status === 'draft') return '준비 중'
  if (e.status === 'finished') return '선거 종료'
  if (e.current_round_status === 'open') return `${e.current_round_no}차 투표 중`
  if (e.current_round_no) return `${e.current_round_no}차 마감 · 다음 회차 준비 중`
  return '곧 시작해요'
}

/** "투표수의 2/3 이상" */
export const thresholdText = (rules: ElectionRules): string => {
  const basis = rules.threshold_basis === 'voters' ? '재적 선거인' : '투표수'
  const half = rules.threshold_num === 1 && rules.threshold_den === 2
  if (half && rules.threshold_comparison === 'gt') return `${basis}의 과반`
  const ratio = `${rules.threshold_num}/${rules.threshold_den}`
  return `${basis}의 ${ratio} ${rules.threshold_comparison === 'gt' ? '초과' : '이상'}`
}

export const turnoutPercent = (voted: number, total: number): number =>
  total > 0 ? Math.min(100, Math.round((voted / total) * 100)) : 0

// ── 관리 화면 프리셋 ──────────────────────────────────────────────────

export interface ThresholdPreset {
  key: string
  label: string
  rules: Pick<ElectionRules, 'threshold_num' | 'threshold_den' | 'threshold_comparison'>
}

export const THRESHOLD_PRESETS: ThresholdPreset[] = [
  { key: 'half', label: '과반', rules: { threshold_num: 1, threshold_den: 2, threshold_comparison: 'gt' } },
  { key: 'two-thirds', label: '2/3 이상', rules: { threshold_num: 2, threshold_den: 3, threshold_comparison: 'gte' } },
  { key: 'three-quarters', label: '3/4 이상', rules: { threshold_num: 3, threshold_den: 4, threshold_comparison: 'gte' } },
]

export const matchPreset = (rules: ElectionRules): string =>
  THRESHOLD_PRESETS.find(
    (p) =>
      p.rules.threshold_num === rules.threshold_num &&
      p.rules.threshold_den === rules.threshold_den &&
      p.rules.threshold_comparison === rules.threshold_comparison
  )?.key ?? 'custom'

export const RUNOFF_META: Record<RunoffRule, { label: string; hint: string }> = {
  top_multiple: { label: '득표순 상위', hint: '남은 자리의 몇 배수만큼 득표순으로 올려요' },
  min_share: { label: '최소 득표율', hint: '투표수 대비 일정 비율 이상 받은 후보만 올려요' },
  all: { label: '전원', hint: '당선되지 않은 후보 모두 다시 올려요' },
}

export const VISIBILITY_META: Record<ResultVisibility, { label: string; hint: string }> = {
  after_close: { label: '마감 후 공개', hint: '투표 중에는 투표율만, 마감하면 득표까지 보여요' },
  live: { label: '실시간 공개', hint: '투표 중에도 성도 화면에 득표가 보여요' },
  admin_only: { label: '공개 안 함', hint: '성도 화면에는 결과가 뜨지 않아요 (현장 발표)' },
}

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

export const labelCls =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

export const cardCls =
  'rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm'
