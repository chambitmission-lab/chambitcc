// 교육과 훈련(/education) 타입 — education_categories / education_programs
//
// 레거시 홈페이지의 "교육과 훈련 > 주일학교 > 영유아부" 3단 메뉴를
// 카테고리(주일학교) → 프로그램(영유아부) 2단으로 편 구조.
// 텍스트는 church_pastors 처럼 ko/en 컬럼 쌍. en 이 비면 ko 로 폴백한다.
// 빈 문자열('')은 '미확인' 규약 — 화면은 그 줄을 숨기고 지어내지 않는다.

export interface EducationProgram {
  id: number
  category_id: number
  name_ko: string
  name_en?: string | null
  target_ko?: string | null
  target_en?: string | null
  meeting_time_ko?: string | null
  meeting_time_en?: string | null
  leader_ko?: string | null
  leader_en?: string | null
  location_ko?: string | null
  location_en?: string | null
  description_ko?: string | null
  description_en?: string | null
  notice_ko?: string | null
  notice_en?: string | null
  image_url?: string | null
  /** 외부 링크 — 재현할 수 없는 콘텐츠(예: 복있는 사람 qtland.com)는 링크로 연다 */
  link_url?: string | null
  link_label_ko?: string | null
  link_label_en?: string | null
  sort_order: number
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface EducationCategory {
  id: number
  key: string
  name_ko: string
  name_en?: string | null
  tagline_ko?: string | null
  tagline_en?: string | null
  description_ko?: string | null
  description_en?: string | null
  emoji?: string | null
  verse_text_ko?: string | null
  verse_text_en?: string | null
  verse_ref_ko?: string | null
  verse_ref_en?: string | null
  sort_order: number
  is_active: boolean
  programs: EducationProgram[]
  created_at?: string | null
  updated_at?: string | null
}

export interface EducationTree {
  categories: EducationCategory[]
}

export type CategoryTextField =
  | 'name'
  | 'tagline'
  | 'description'
  | 'verse_text'
  | 'verse_ref'

export type ProgramTextField =
  | 'name'
  | 'target'
  | 'meeting_time'
  | 'leader'
  | 'location'
  | 'description'
  | 'notice'
  | 'link_label'

export type CategoryPayload = Partial<
  Omit<EducationCategory, 'id' | 'sort_order' | 'programs' | 'created_at' | 'updated_at'>
> & { key: string; name_ko: string }

export type CategoryUpdatePayload = Partial<
  Omit<EducationCategory, 'id' | 'sort_order' | 'programs' | 'created_at' | 'updated_at'>
>

export type ProgramPayload = Partial<
  Omit<EducationProgram, 'id' | 'sort_order' | 'created_at' | 'updated_at'>
> & { category_id: number; name_ko: string }

export type ProgramUpdatePayload = Partial<
  Omit<EducationProgram, 'id' | 'sort_order' | 'created_at' | 'updated_at'>
>

type Lang = 'ko' | 'en'

/** 현재 언어 값, 비어 있으면 한국어 폴백 (영문은 선택 입력) */
const pick = (row: Record<string, unknown>, field: string, language: Lang): string => {
  const primary = row[`${field}_${language}`]
  if (typeof primary === 'string' && primary.trim().length > 0) return primary
  const fallback = row[`${field}_ko`]
  return typeof fallback === 'string' ? fallback : ''
}

export const categoryText = (
  category: EducationCategory | null | undefined,
  field: CategoryTextField,
  language: Lang,
): string => (category ? pick(category as unknown as Record<string, unknown>, field, language) : '')

export const programText = (
  program: EducationProgram | null | undefined,
  field: ProgramTextField,
  language: Lang,
): string => (program ? pick(program as unknown as Record<string, unknown>, field, language) : '')
