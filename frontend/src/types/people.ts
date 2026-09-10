// 섬기는 사람들(/people) 타입 — church_people
//
// 레거시 홈페이지 '교회소개 > 섬기는사람들'의 교역자/파송선교사/장로/교회직원 4탭을
// category 한 컬럼으로 받는다. 탭 안의 소제목('부목사' / '시무장로')은 group_ko —
// 별도 테이블이 아니라 자유 텍스트라 교회가 부르는 이름을 그대로 쓴다.
// 담임·원로목사는 여기 없다. church_pastors(=/greeting)가 단일 출처이고
// 서버가 leaders 로 얹어 준다.
// 텍스트는 ko/en 컬럼 쌍. en 이 비면 ko 로 폴백한다.

export type PersonCategory = 'pastor' | 'missionary' | 'elder' | 'staff'

export const PERSON_CATEGORIES: PersonCategory[] = ['pastor', 'missionary', 'elder', 'staff']

export const CATEGORY_LABEL: Record<PersonCategory, { ko: string; en: string }> = {
  pastor: { ko: '교역자', en: 'Pastors' },
  missionary: { ko: '파송선교사', en: 'Missionaries' },
  elder: { ko: '장로', en: 'Elders' },
  staff: { ko: '교회직원', en: 'Staff' },
}

/** group_ko 가 비었을 때 쓰는 기본 섹션 헤더 */
export const CATEGORY_DEFAULT_GROUP: Record<PersonCategory, { ko: string; en: string }> = {
  pastor: { ko: '교역자', en: 'Pastoral staff' },
  missionary: { ko: '파송선교사', en: 'Missionaries we send' },
  elder: { ko: '장로', en: 'Elders' },
  staff: { ko: '교회직원', en: 'Church staff' },
}

/** started_on 의 뜻은 카테고리가 정한다 — 부임 / 파송 / 임직 */
export const CATEGORY_DATE_LABEL: Record<PersonCategory, { ko: string; en: string }> = {
  pastor: { ko: '부임', en: 'Since' },
  missionary: { ko: '파송', en: 'Sent' },
  elder: { ko: '임직', en: 'Ordained' },
  staff: { ko: '근무 시작', en: 'Since' },
}

export interface Person {
  id: number
  category: PersonCategory
  group_ko?: string | null
  group_en?: string | null

  name_ko: string
  name_en?: string | null
  role_ko?: string | null
  role_en?: string | null
  photo_url?: string | null

  phone?: string | null
  email?: string | null

  /** 담당 구역·부서·위원회 — 한 줄에 하나 */
  assignments_ko?: string | null
  assignments_en?: string | null
  bio_ko?: string | null
  bio_en?: string | null
  /** 삶의 말씀 한 줄 */
  verse_ko?: string | null
  verse_en?: string | null

  /** 선교사 — 사역지 / 국가(flag-icons 코드) / 파송기관 */
  field_ko?: string | null
  field_en?: string | null
  country_code?: string | null
  org_ko?: string | null
  org_en?: string | null

  started_on?: string | null
  sort_order: number
  is_published: boolean

  created_at?: string | null
  updated_at?: string | null
}

/** church_pastors 에서 빌려오는 대표 카드(담임·원로) — 읽기 전용 */
export interface LeaderCard {
  pastor_id: number
  name_ko: string
  name_en?: string | null
  role_ko: string
  role_en?: string | null
  photo_url?: string | null
  headline_ko?: string | null
  headline_en?: string | null
  status: 'current' | 'emeritus'
}

/** /people 이 한 번의 요청으로 화면 전체를 그린다 */
export interface PeopleDirectory {
  leaders: LeaderCard[]
  people: Person[]
}

export type PersonCreatePayload = Partial<Omit<Person, 'id' | 'created_at' | 'updated_at'>> & {
  name_ko: string
}

export type PersonUpdatePayload = Partial<Omit<Person, 'id' | 'created_at' | 'updated_at'>>

/** ko/en 짝을 이루는 텍스트 필드 — 편집 폼과 표시 헬퍼가 공유한다 */
export type PersonTextField =
  | 'group'
  | 'name'
  | 'role'
  | 'assignments'
  | 'bio'
  | 'verse'
  | 'field'
  | 'org'

/** 현재 언어 값을 꺼내되 비어 있으면 한국어로 폴백 (영문은 선택 입력) */
export const personText = (
  person: Person | null | undefined,
  field: PersonTextField,
  language: 'ko' | 'en',
): string => {
  if (!person) return ''
  const primary = person[`${field}_${language}` as keyof Person]
  if (typeof primary === 'string' && primary.trim().length > 0) return primary
  const fallback = person[`${field}_ko` as keyof Person]
  return typeof fallback === 'string' ? fallback : ''
}

export const leaderText = (
  leader: LeaderCard,
  field: 'name' | 'role' | 'headline',
  language: 'ko' | 'en',
): string => {
  const primary = leader[`${field}_${language}` as keyof LeaderCard]
  if (typeof primary === 'string' && primary.trim().length > 0) return primary
  const fallback = leader[`${field}_ko` as keyof LeaderCard]
  return typeof fallback === 'string' ? fallback : ''
}

/** '2교구\n2청년부' → ['2교구', '2청년부'] — 빈 줄은 버린다 */
export const assignmentList = (person: Person, language: 'ko' | 'en'): string[] =>
  personText(person, 'assignments', language)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

/** 이름 + 직분 — '최요한 목사' (직분이 없으면 이름만) */
export const personTitle = (person: Person, language: 'ko' | 'en'): string => {
  const name = personText(person, 'name', language)
  const role = personText(person, 'role', language)
  return role ? `${name} ${role}` : name
}

/** '2019-03-01' → '2019.03' — 카드/시트의 시작일 표기 */
export const personDateLabel = (value?: string | null): string => {
  if (!value) return ''
  const [year, month] = value.split('-')
  if (!/^\d{4}$/.test(year ?? '')) return ''
  return month ? `${year}.${month}` : year
}

/** 사진이 없을 때 원형 자리에 넣는 이니셜 — 한글은 성 한 자 */
export const personInitial = (name: string): string => name.trim().charAt(0) || '·'

/* 담임·원로목사는 church_pastors(= /admin/pastors)가 단일 출처다. 여기에 등록하면
   대표 카드가 아니라 교역자 탭의 일반 카드로 내려가 두 번 보인다 — 관리자 화면이
   그걸 조용히 넘기지 않도록 이름표로 잡아낸다(직분/그룹 어디에 적었든). */
const LEADER_ROLE_WORDS = ['담임목사', '담임 목사', '원로목사', '원로 목사']

export const looksLikeLeaderRole = (person: {
  role_ko?: string | null
  group_ko?: string | null
}): boolean => {
  const haystack = `${person.role_ko ?? ''} ${person.group_ko ?? ''}`
  return LEADER_ROLE_WORDS.some((word) => haystack.includes(word))
}

/** 같은 group 끼리 묶는다. group 이 비면 카테고리 기본 라벨로 */
export interface PersonGroup {
  key: string
  label: string
  people: Person[]
}

export const groupPeople = (
  people: Person[],
  category: PersonCategory,
  language: 'ko' | 'en',
): PersonGroup[] => {
  const fallback = CATEGORY_DEFAULT_GROUP[category][language]
  const groups: PersonGroup[] = []
  people.forEach((person) => {
    const label = personText(person, 'group', language) || fallback
    const found = groups.find((g) => g.key === label)
    if (found) found.people.push(person)
    else groups.push({ key: label, label, people: [person] })
  })
  return groups
}
