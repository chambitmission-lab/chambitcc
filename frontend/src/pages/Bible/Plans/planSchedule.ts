// 교회 달력 고정 플랜 · 그날의 설교(새벽기도회) 표시 헬퍼
// 날짜 문자열은 서버가 KST 달력일 'YYYY-MM-DD'로 주므로 Date 타임존 변환 없이 다룬다.
import type { PlanDaySermon, PlanPassage, PlanScheduleMode } from '../../../types/biblePlan'
import { formatMd, parseYmd, toYmd } from '../../Rooms/roomCourses'

export const SERMON_DEFAULT_LABEL = '새벽기도회'

export const isCalendarPlan = (p?: { schedule_mode?: PlanScheduleMode | null } | null) =>
  p?.schedule_mode === 'calendar'

/** 'YYYY-MM-DD' → '9/14 (월)' — 값이 없으면 null */
export const formatPlanDay = (ymd?: string | null): string | null =>
  ymd ? formatMd(ymd.slice(0, 10)) : null

/** 기기 로컬 오늘 'YYYY-MM-DD' */
export const todayYmd = () => toYmd(new Date())

/** 1일차 날짜 + (일차 - 1) → 'YYYY-MM-DD' */
export const dayDate = (anchor: string, dayNumber: number) => {
  const d = parseYmd(anchor)
  d.setDate(d.getDate() + dayNumber - 1)
  return toYmd(d)
}

export const passageRefs = (passages?: PlanPassage[] | null) =>
  (passages ?? []).map((p) => p.reference).filter(Boolean).join(' · ')

/** '열왕기하 5:1-14 · 김보은 강도사' / '개인묵상' — 보여줄 게 없으면 null */
export const sermonSummary = (s?: PlanDaySermon | null): string | null => {
  if (!s) return null
  const parts = [passageRefs(s.passages), s.preacher?.trim()].filter(Boolean)
  if (parts.length) return parts.join(' · ')
  return s.note?.trim() || null
}
