// 문화교실 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { CultureApplication, CultureApplicationStatus, CultureClassAdmin, CultureNotice } from '../../../types/culture'

export type CultureTab = 'classes' | 'applications' | 'notices'
export type AppFilter = 'all' | CultureApplicationStatus

export const APP_FILTERS: [AppFilter, string][] = [
  ['all', '모두'],
  ['pending', '접수 대기'],
  ['confirmed', '등록 완료'],
  ['cancelled', '취소됨'],
]

/** 정원·잔여 — 신청 수는 서버 기준(취소 제외) */
export const seatsOf = (c: Pick<CultureClassAdmin, 'capacity' | 'application_count'>) => {
  const cap = c.capacity && c.capacity > 0 ? c.capacity : null
  const remaining = cap == null ? null : Math.max(0, cap - c.application_count)
  return { cap, remaining, full: remaining === 0, ratio: cap ? Math.min(1, c.application_count / cap) : 0 }
}

/** 성도 화면 상태 — 숨김 > 모집 중 > 모집 마감 */
export const classPhase = (c: Pick<CultureClassAdmin, 'is_active' | 'is_open'>): 'hidden' | 'open' | 'closed' =>
  !c.is_active ? 'hidden' : c.is_open ? 'open' : 'closed'

const has = (v: string | null | undefined, q: string) => !!v && v.toLowerCase().includes(q)

export const filterClasses = (list: CultureClassAdmin[], q: string) => {
  const s = q.trim().toLowerCase()
  return s ? list.filter((c) => has(c.title, s) || has(c.instructor, s) || has(c.quarter, s)) : list
}

/** 전화번호는 숫자만 비교 — '010-1234' 로 찾아도 '01012345678' 이 걸린다 */
export const filterApplications = (list: CultureApplication[], q: string, status: AppFilter, classId: number | null) => {
  const s = q.trim().toLowerCase()
  const digits = s.replace(/\D/g, '')
  return list.filter(
    (a) =>
      (status === 'all' || a.status === status) &&
      (classId == null || a.class_id === classId) &&
      (!s || has(a.name, s) || has(a.class_title, s) || (digits.length >= 3 && a.phone.replace(/\D/g, '').includes(digits))),
  )
}

export const filterNotices = (list: CultureNotice[], q: string) => {
  const s = q.trim().toLowerCase()
  return s ? list.filter((n) => has(n.title, s) || has(n.content, s)) : list
}

export const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return p
}

export const shortDate = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}.${d.getDate()}`
}
export const longDate = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

/** 신청 목록은 최신순으로 온다 — 접수 대기를 먼저(처리할 것부터) */
export const sortApplications = (list: CultureApplication[]) => {
  const rank: Record<CultureApplicationStatus, number> = { pending: 0, confirmed: 1, cancelled: 2 }
  return [...list].sort((a, b) => rank[a.status] - rank[b.status] || b.created_at.localeCompare(a.created_at))
}
