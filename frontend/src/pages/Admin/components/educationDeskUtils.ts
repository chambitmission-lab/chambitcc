// 교육과 훈련 관리 데스크 규칙 — 실제 화면(EducationManagement)과 dev 미리보기가 같이 쓴다
import type { EducationCategory, EducationProgram } from '../../../types/education'

export type EduSeg = 'all' | 'pending' | 'hidden'
export type EduSel = { kind: 'category' | 'program'; id: number }

/** 시간·담당·장소가 모두 비면 성도 화면에 '곧 채워집니다'로 보인다 — 채울 곳 */
export const isPendingProgram = (p: EducationProgram) => !p.meeting_time_ko && !p.leader_ko && !p.location_ko

/** 비어 있는 핵심 칸 이름 */
export const missingFields = (p: EducationProgram) =>
  ([
    ['모이는 때', p.meeting_time_ko],
    ['담당', p.leader_ko],
    ['장소', p.location_ko],
  ] as const)
    .filter(([, v]) => !v?.trim())
    .map(([k]) => k)

/** 검색(부서·담당·장소·대상) + 세그먼트 — 카테고리 이름이 맞으면 그 아래 프로그램은 다 보인다 */
export const filterEducation = (categories: EducationCategory[], searchTerm: string, seg: EduSeg): EducationCategory[] => {
  const q = searchTerm.trim().toLowerCase()
  const hit = (p: EducationProgram) =>
    [p.name_ko, p.leader_ko, p.location_ko, p.target_ko].some((v) => v?.toLowerCase().includes(q))
  const out: EducationCategory[] = []
  for (const c of categories) {
    const catHit = !q || c.name_ko.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
    let programs = c.programs.filter((p) => catHit || hit(p))
    if (seg === 'pending') programs = programs.filter(isPendingProgram)
    if (seg === 'hidden' && c.is_active) programs = programs.filter((p) => !p.is_active)
    const keep =
      programs.length > 0 || (catHit && (seg === 'all' || (seg === 'hidden' && !c.is_active)))
    if (keep) out.push({ ...c, programs })
  }
  return out
}

/** 목록에 보이는 순서 그대로 — ↑↓ 키 이동용 */
export const flattenSel = (categories: EducationCategory[]): EduSel[] =>
  categories.flatMap((c) => [{ kind: 'category' as const, id: c.id }, ...c.programs.map((p) => ({ kind: 'program' as const, id: p.id }))])
