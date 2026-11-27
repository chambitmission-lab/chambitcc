// 새가족 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
// registered_at 은 'YYYY-MM-DD'(등록 주일, 날짜 개념) — 타임존 보정 없이 문자열로 다룬다
import type { NewFamilyPost } from '../../../types/newFamily'
import { KO_WEEKDAYS, kstNow } from '../../../utils/date'

export type FamilyTab = 'all' | 'published' | 'hidden'

const ymd = (v: string) => v.split('-').map(Number) as [number, number, number]

export const filterFamily = (posts: NewFamilyPost[], tab: FamilyTab, q: string) => {
  const s = q.trim().toLowerCase()
  return posts
    .filter((p) => (tab === 'all' ? true : tab === 'published' ? p.is_published : !p.is_published))
    .filter(
      (p) =>
        !s ||
        p.member_name.toLowerCase().includes(s) ||
        (p.group_name?.toLowerCase().includes(s) ?? false) ||
        (p.greeting?.toLowerCase().includes(s) ?? false),
    )
    .sort((a, b) => b.registered_at.localeCompare(a.registered_at) || b.id - a.id)
}

export const familyMonthKey = (p: NewFamilyPost) => p.registered_at.slice(0, 7)
export const familyMonthLabel = (p: NewFamilyPost, now: Date = kstNow()) => {
  const [y, m] = ymd(p.registered_at)
  return y === now.getFullYear() ? `${m}월` : `${y}년 ${m}월`
}

/** '11월 23일 주일' — 주일이 아니면 요일 그대로 */
export const registeredLabel = (v: string) => {
  const [y, m, d] = ymd(v)
  if (!y || !m || !d) return v
  const wd = new Date(y, m - 1, d).getDay()
  return `${m}월 ${d}일 ${wd === 0 ? '주일' : `${KO_WEEKDAYS[wd]}요일`}`
}

export const familyStats = (posts: NewFamilyPost[], now: Date = kstNow()) => {
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  let month = 0
  let year = 0
  for (const p of posts) {
    const [py, pm] = ymd(p.registered_at)
    if (py === y) {
      year++
      if (pm === m) month++
    }
  }
  return { month, year, hidden: posts.filter((p) => !p.is_published).length }
}

/** 소개 카드에 비어 있는 것 — 사진·인사말 */
export const familyMissing = (p: NewFamilyPost) => [p.photo_count === 0 && '사진', !p.greeting?.trim() && '인사말'].filter(Boolean) as string[]
