// 진행 중 투표를 "말로 풀어" 알려 주는 계산 — PC 선거 관리(ElectionDesk) 중계 화면의 숫자 칸·문장 카드.
//
// 화면을 보는 분들은 대개 장로님·안수집사님 선관위원이다. 그래서 그래프 대신
// "최근 10분 동안 5명", "이 속도대로라면 마감 때 약 98명", "아직 입력하지 않은 종이 표 28장"처럼
// 숫자 하나와 문장 하나로 말한다. 계산은 이 파일에만 두고(테스트 대상), 컴포넌트는 그리기만 한다.
//
// 최근 흐름(recent_votes)은 서버가 표 수 합계만 시간별로 적어 둔 값이다 — 누가 언제 투표했는지는 없다.
import type { ElectionSummary } from '../../../../types/election'

export type WordTone = 'normal' | 'accent' | 'good' | 'warn'

export interface WordCard {
  label: string
  value: string
  unit?: string
  text: string
  tone: WordTone
}

export interface LiveWords {
  percent: number
  voted: number
  total: number
  waiting: number
  /** 마감까지 남은 분 — 예약 마감이 없으면 null, 지났으면 0 */
  minutesLeft: number | null
  quorum: number
  quorumMet: boolean
  cards: [WordCard, WordCard, WordCard]
}

const minutesBetween = (fromMs: number, toMs: number) => Math.max(0, Math.ceil((toMs - fromMs) / 60000))

/** 성원에 필요한 최소 투표자 수 — 백엔드 election_rules.quorum_required 와 같은 올림 */
export const quorumRequired = (e: Pick<ElectionSummary, 'rules'>, total: number): number => {
  const { quorum_num: num, quorum_den: den } = e.rules
  if (!num || num <= 0 || total <= 0 || !den) return 0
  return Math.max(1, Math.ceil((total * num) / den))
}

const recentCard = (e: ElectionSummary, waiting: number): WordCard => {
  if (waiting === 0) {
    return { label: '투표 현황', value: '모두', text: '선거인 모두가 투표하셨어요. 마감해도 됩니다.', tone: 'good' }
  }
  const votes = e.recent_votes
  const minutes = e.recent_minutes
  if (votes == null || !minutes) {
    return {
      label: '최근 흐름',
      value: '확인 중',
      text: '투표가 들어오는 빠르기를 재고 있어요. 1~2분 뒤에 알려 드려요.',
      tone: 'normal',
    }
  }
  const perMinute = votes / minutes
  const text =
    votes === 0
      ? '그동안 들어온 표가 없어요. 투표가 거의 끝나 가요.'
      : perMinute >= 1
        ? `1분에 ${Math.round(perMinute)}명꼴로 들어오고 있어요.`
        : `${Math.max(1, Math.round(1 / perMinute))}분에 1명꼴로 들어오고 있어요.`
  return { label: `최근 ${minutes}분 동안`, value: String(votes), unit: '명', text, tone: 'accent' }
}

const projectionCard = (
  e: ElectionSummary,
  voted: number,
  total: number,
  minutesLeft: number | null,
  quorum: number,
): WordCard => {
  if (minutesLeft == null) {
    return {
      label: '마감 시각',
      value: '정하지 않음',
      text: '현황판에서 예약 마감을 정하면, 마감 때 몇 분이 투표하실지 미리 알려 드려요.',
      tone: 'normal',
    }
  }
  if (minutesLeft === 0) {
    return { label: '마감 시각', value: '지금', text: '곧 자동으로 마감됩니다.', tone: 'warn' }
  }
  if (voted >= total) {
    return { label: '이대로 마감하면', value: String(total), unit: '명', text: '모두 투표하셨어요.', tone: 'good' }
  }
  const votes = e.recent_votes
  const minutes = e.recent_minutes
  if (votes == null || !minutes) {
    return {
      label: '마감 때 예상',
      value: '확인 중',
      text: '투표 빠르기를 재는 중이에요. 잠시 뒤에 예상 인원을 알려 드려요.',
      tone: 'normal',
    }
  }
  const projected = Math.min(total, Math.round(voted + (votes / minutes) * minutesLeft))
  const short = quorum > 0 && projected < quorum
  return {
    label: '이 속도대로라면 마감 때',
    value: `약 ${projected}`,
    unit: '명',
    text: short
      ? `성원(${quorum}명)에 못 미칠 수 있어요. 미투표자 알림을 보내 보세요.`
      : `${total}명 중 ${Math.round((projected / total) * 100)}%가 투표하게 돼요.`,
    tone: short ? 'warn' : 'accent',
  }
}

const paperCard = (e: ElectionSummary): WordCard => {
  const expected = e.paper_expected ?? 0
  const entered = e.paper_in ?? 0
  if (expected <= 0) {
    return { label: '종이 투표', value: '없음', text: '이번 회차는 앱으로만 투표해요.', tone: 'normal' }
  }
  const pending = Math.max(0, expected - entered)
  if (pending === 0) {
    return {
      label: '종이 표',
      value: '모두 입력',
      text: `종이 표 ${entered}장이 모두 입력됐어요.`,
      tone: 'good',
    }
  }
  return {
    label: '아직 입력하지 않은 종이 표',
    value: String(pending),
    unit: '장',
    text: `종이로 투표할 수 있는 ${expected}명 중 ${entered}장이 입력됐어요. 모인 투표지를 현황판에서 입력해 주세요.`,
    tone: 'warn',
  }
}

export const liveWords = (e: ElectionSummary, nowMs = Date.now()): LiveWords => {
  const total = e.voters_total
  const voted = Math.min(e.voted_count, total || e.voted_count)
  const waiting = Math.max(0, total - voted)
  const percent = total > 0 ? Math.min(100, Math.round((voted / total) * 100)) : 0
  const minutesLeft = e.round_closes_at ? minutesBetween(nowMs, new Date(e.round_closes_at).getTime()) : null
  const quorum = quorumRequired(e, total)
  return {
    percent,
    voted,
    total,
    waiting,
    minutesLeft,
    quorum,
    quorumMet: quorum === 0 || voted >= quorum,
    cards: [recentCard(e, waiting), projectionCard(e, voted, total, minutesLeft, quorum), paperCard(e)],
  }
}

/** "오후 3시 30분" — 어르신 눈높이라 콜론 시각 대신 말로 */
export const spokenTime = (iso: string | Date): string => {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const h = d.getHours()
  const m = d.getMinutes()
  const half = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${half} ${h12}시${m ? ` ${m}분` : ''}`
}

/** "23분" / "1시간 5분" */
export const spokenDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}분`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}시간 ${m}분` : `${h}시간`
}
