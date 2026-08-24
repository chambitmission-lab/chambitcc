// 담임목사 인사말 / 프로필 타입 (church_pastors)
//
// about_content 와 달리 '다건'이다 — 목사가 바뀌면 덮어쓰지 않고 새 레코드를
// 추가하고 status 만 옮긴다. 그래야 인사말·사진·약력이 역대 기록으로 남는다.

/** 화면에서의 자리. 재직 여부가 아니라 '어디에 보이는가'를 정한다. */
export type PastorStatus =
  | 'current' // 현 담임목사 — /greeting 본문의 주인공 (교회당 1명)
  | 'emeritus' // 원로목사 — 역대 스트립에 예우 배지와 함께
  | 'former' // 전임 담임목사 — 역대 스트립

export interface Pastor {
  id: number

  name_ko: string
  name_en?: string | null
  role_ko: string
  role_en?: string | null
  nickname_ko?: string | null
  nickname_en?: string | null
  photo_url?: string | null

  greeting_title_ko?: string | null
  greeting_title_en?: string | null
  greeting_body_ko?: string | null
  greeting_body_en?: string | null
  signature_ko?: string | null
  signature_en?: string | null

  profile_headline_ko?: string | null
  profile_headline_en?: string | null
  profile_intro_ko?: string | null
  profile_intro_en?: string | null
  education_ko?: string | null
  education_en?: string | null
  career_ko?: string | null
  career_en?: string | null
  awards_ko?: string | null
  awards_en?: string | null

  term_start?: string | null
  term_end?: string | null
  status: PastorStatus
  sort_order: number
  is_published: boolean

  created_at?: string | null
  updated_at?: string | null
}

/** /greeting 이 한 번의 요청으로 화면 전체를 그린다 */
export interface PastorListResponse {
  current: Pastor | null
  past: Pastor[]
}

/** 등록 payload — 서버가 기본값을 채우는 필드는 생략 가능 */
export type PastorCreatePayload = Partial<Omit<Pastor, 'id' | 'created_at' | 'updated_at'>> & {
  name_ko: string
}

/** 수정 payload — 보낸 키만 반영된다 (부분 수정) */
export type PastorUpdatePayload = Partial<Omit<Pastor, 'id' | 'created_at' | 'updated_at'>>

/** ko/en 짝을 이루는 텍스트 필드 — 편집 폼과 표시 헬퍼가 공유하는 키 집합 */
export type PastorTextField =
  | 'name'
  | 'role'
  | 'nickname'
  | 'greeting_title'
  | 'greeting_body'
  | 'signature'
  | 'profile_headline'
  | 'profile_intro'
  | 'education'
  | 'career'
  | 'awards'

/**
 * 현재 언어 값을 꺼내되 비어 있으면 한국어로 폴백한다.
 * 영문은 선택 입력이라 대부분 비어 있고, 그때 화면이 비면 안 된다.
 */
export const pastorText = (
  pastor: Pastor | null | undefined,
  field: PastorTextField,
  language: 'ko' | 'en',
): string => {
  if (!pastor) return ''
  const primary = pastor[`${field}_${language}` as keyof Pastor]
  if (typeof primary === 'string' && primary.trim().length > 0) return primary
  const fallback = pastor[`${field}_ko` as keyof Pastor]
  return typeof fallback === 'string' ? fallback : ''
}

/** '2019-03-01' → '2019' — 역대 스트립의 재임 기간 표기용 */
const yearOf = (value?: string | null): string | null => {
  if (!value) return null
  const year = value.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : null
}

/** 재임 기간 라벨. 종료일이 없으면 '현재'(en: present) */
export const pastorTermLabel = (pastor: Pastor, language: 'ko' | 'en'): string => {
  const start = yearOf(pastor.term_start)
  const end = yearOf(pastor.term_end)
  const now = language === 'ko' ? '현재' : 'present'
  if (!start && !end) return ''
  if (!start) return `~ ${end}`
  return `${start} ~ ${end ?? (pastor.status === 'current' ? now : '')}`.trim()
}
