// 선거 화면 공통 — 상태 문구·당선 기준 문장·기준 프리셋
//
// 기준의 "값"은 서버(services/election_rules.py)가 정한다. 여기는 그 값을 사람 말로
// 옮기고, 관리 화면에서 고르기 쉬운 프리셋을 늘어놓을 뿐이다.
import type {
  ElectionRules,
  ElectionStatus,
  ElectionSummary,
  ResultVisibility,
  RosterPoolMember,
  RunoffRule,
} from '../../types/election'
import { KO_WEEKDAYS } from '../../utils/dateUtils'

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

/** "재적의 1/2 이상" — 성원을 따지지 않으면 null */
export const quorumText = (rules: ElectionRules): string | null =>
  rules.quorum_num > 0 ? `재적의 ${rules.quorum_num}/${rules.quorum_den} 이상 투표` : null

const WEEKDAYS = KO_WEEKDAYS

/** 예약 마감 시각 — 오늘이면 "오후 3:00", 아니면 "10/18(토) 오후 3:00" */
export const closesAtLabel = (iso: string, now = new Date()): string => {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay ? time : `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]}) ${time}`
}

/** 남은 시간 — "12분", "1시간 5분". 지났으면 null */
export const remainingLabel = (iso: string, now = Date.now()): string | null => {
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return null
  const minutes = Math.ceil(ms / 60000)
  if (minutes < 60) return `${minutes}분`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}시간 ${m}분` : `${h}시간`
}

/** datetime-local 입력값(로컬 시각) ↔ ISO */
export const toLocalInputValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

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
  live: {
    label: '실시간 공개',
    hint: '투표 중에도 성도 화면에 득표가 보여요. 투표가 뜸할 때는 누가 누구를 찍었는지 짐작될 수 있어 권하지 않아요',
  },
  admin_only: { label: '공개 안 함', hint: '성도 화면에는 결과가 뜨지 않아요 (현장 발표)' },
}

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

export const labelCls =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

export const cardCls =
  'rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm'

// ── 명부·선관위원 고르기 화면 공용 (선거 편집기·공동의회 편집기) ──────

export const chipBtn = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-[12.5px] font-bold border transition-colors ${
    active
      ? 'bg-brand text-white border-transparent'
      : 'border-gray-200 dark:border-white/[0.1] text-ink-muted hover:border-brand hover:text-brand'
  }`

/** 명부 한 줄의 단서 — "집사 · 3구역 · 1962년생 · ☎5678" */
export const memberHint = (m: RosterPoolMember) =>
  [m.church_title, m.district, m.birth_year ? `${m.birth_year}년생` : null, m.phone_tail ? `☎${m.phone_tail}` : null]
    .filter(Boolean)
    .join(' · ')

// ── 공동의회 이어서 투표 (성도 화면) ──────────────────────────────────

export interface AssemblyProgress {
  title: string
  /** 지금 열려 있고 내가 선거인인 선거 — 만든 순서(장로 → 권사 → 안수집사) */
  ballots: ElectionSummary[]
  /** 그중 아직 투표하지 않은 것 */
  left: ElectionSummary[]
  /** 지금 보는 선거 말고, 다음에 투표할 선거 */
  next: ElectionSummary | null
}

/**
 * 같은 공동의회에서 지금 함께 열려 있는 투표들. 둘 이상일 때만 돌려준다 —
 * 하나뿐이면(순차 진행·단독 선거) 여느 선거와 똑같이 보이면 된다.
 * 내 선거 목록(useElections)에서 계산한다: 투표권이 없는(제외된) 선거는 애초에 목록에 없다.
 */
export const assemblyProgress = (
  list: ElectionSummary[] | undefined,
  assemblyId: number | null | undefined,
  currentId?: number
): AssemblyProgress | null => {
  if (!assemblyId || !list) return null
  const ballots = list
    .filter(
      (e) => e.assembly_id === assemblyId && e.current_round_status === 'open' && (e.can_vote || e.has_voted)
    )
    .sort((a, b) => a.id - b.id)
  if (ballots.length < 2) return null
  const left = ballots.filter((e) => e.can_vote)
  return {
    title: ballots[0].assembly_title ?? '공동의회',
    ballots,
    left,
    next: left.find((e) => e.id !== currentId) ?? null,
  }
}
