// 설문 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { SurveyStatus, SurveySummary } from '../../../types/survey'
import { daysLeft, displayStatus } from '../../Survey/surveyShared'

/** 목록 묶음 순서 — 지금 손볼 것(진행 중)부터 */
export const SURVEY_GROUPS: { status: SurveyStatus; label: string }[] = [
  { status: 'open', label: '진행 중' },
  { status: 'draft', label: '작성 중' },
  { status: 'closed', label: '마감' },
]

export const filterSurveys = (surveys: SurveySummary[], q: string) => {
  const s = q.trim().toLowerCase()
  return surveys.filter((x) => !s || x.title.toLowerCase().includes(s) || (x.description?.toLowerCase().includes(s) ?? false))
}

/** 묶음별로 나눈 뒤 위→아래 보이는 순서 그대로 펼친 목록 */
export const groupSurveys = (surveys: SurveySummary[]) => {
  const groups = SURVEY_GROUPS.map((g) => ({
    ...g,
    items: surveys
      .filter((s) => displayStatus(s) === g.status)
      .sort((a, b) => a.display_order - b.display_order || (b.created_at ?? '').localeCompare(a.created_at ?? '')),
  })).filter((g) => g.items.length > 0)
  return { groups, order: groups.flatMap((g) => g.items) }
}

/** 마감 표기 — 'D-3' / '오늘 마감' / '마감일 지남' / null(마감일 없음) */
export const endsLabel = (s: SurveySummary): string | null => {
  const d = daysLeft(s.ends_at)
  if (d == null) return null
  if (d < 0) return '마감일 지남'
  return d === 0 ? '오늘 마감' : `D-${d}`
}

/** 서버 상태는 진행인데 마감일이 지나 실제로는 응답을 안 받는 설문 */
export const isStaleOpen = (s: SurveySummary) => s.status === 'open' && displayStatus(s) === 'closed'
