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

/** 대표 카드 텍스트 — church_pastors(LeaderCard) 든 합쳐진 LeaderSlot 이든 같은 필드 */
type LeaderTextSource = Pick<
  LeaderCard,
  'name_ko' | 'name_en' | 'role_ko' | 'role_en' | 'headline_ko' | 'headline_en'
>

export const leaderText = (
  leader: LeaderTextSource,
  field: 'name' | 'role' | 'headline',
  language: 'ko' | 'en',
): string => {
  const primary = leader[`${field}_${language}` as keyof LeaderTextSource]
  if (typeof primary === 'string' && primary.trim().length > 0) return primary
  const fallback = leader[`${field}_ko` as keyof LeaderTextSource]
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

/* 담임·원로목사의 이름·직분·인사말은 church_pastors(= /admin/pastors)가 단일 출처다.
   church_people 쪽 기록은 대표 카드에 합쳐져 사진(우선)·담당 사역·연락처를 얹는다 —
   관리자 화면이 그 관계를 설명할 수 있게 이름표로 잡아낸다(직분/그룹 어디에 적었든). */
const LEADER_ROLE_WORDS = ['담임목사', '담임 목사', '원로목사', '원로 목사']

export const looksLikeLeaderRole = (person: {
  role_ko?: string | null
  group_ko?: string | null
}): boolean => {
  const haystack = `${person.role_ko ?? ''} ${person.group_ko ?? ''}`
  return LEADER_ROLE_WORDS.some((word) => haystack.includes(word))
}

/* ── 예우 그룹 ────────────────────────────────────────
   '명예전도사' · '은퇴장로'처럼 현직에서 물러난 뒤에도 이름을 올려 두는 자리.
   레거시 홈페이지가 그랬듯 현직 다음에 두고, 그룹이 하나뿐이어도 소제목을 지우지
   않는다 — '명예전도사'라는 말 자체가 예우라서 이름 위에 남아 있어야 한다. */
const HONOR_GROUP_WORDS = ['명예', '원로', '은퇴', 'honorary', 'emerit', 'retired']

export const isHonorGroup = (label: string): boolean => {
  const haystack = label.toLowerCase()
  return HONOR_GROUP_WORDS.some((word) => haystack.includes(word))
}

/** 같은 group 끼리 묶는다. group 이 비면 카테고리 기본 라벨로 */
export interface PersonGroup {
  key: string
  label: string
  /** 명예·원로·은퇴 — 현직 뒤로 놓이고 소제목을 항상 보여준다 */
  honor: boolean
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
    else
      groups.push({
        key: label,
        label,
        // 표시 언어가 영어여도 예우 여부는 한국어 원문까지 함께 본다
        honor: isHonorGroup(`${label} ${person.group_ko ?? ''}`),
        people: [person],
      })
  })
  // 예우 그룹은 현직 뒤로 (sort 는 안정 정렬이라 나머지 순서는 그대로)
  return groups.sort((a, b) => Number(a.honor) - Number(b.honor))
}

/* ── 대표(담임·원로) 중복 정리 ──────────────────────────
   church_pastors(대표 카드)와 church_people(교역자 격자)은 서로 다른 테이블이라
   같은 분이 양쪽에 등록되면 한 화면에 두 번 보인다. 공용 키가 없어 이름으로 맞추고,
   대표 카드를 남긴 뒤 격자에서 뺀다 — 대신 대표 카드를 누르면 그분의 인물 시트가 열려
   담당 사역·연락처는 그대로 닿는다. */

/* ── 대표(담임·원로) 한 줄 ──────────────────────────────
   대표 카드는 두 곳에서 온다. 담임목사는 인사말(/greeting)이 있어 church_pastors 에 있고,
   원로목사는 인사말을 넣을 수 없어 church_people(교역자)에만 등록되기도 한다.
   두 출처를 한 줄로 합치고(원로가 왼쪽, 담임이 오른쪽), 여기 올라간 분은 아래 교역자
   격자에서 뺀다 — 같은 화면에 두 번 보이지 않게. church_people 쪽 대표는 다른 카드처럼
   눌러 인물 시트(담당 사역·연락처)를 열 수 있다. */

/** 대표 카드 한 자리 — 출처가 어디든 화면은 같은 모양으로 그린다 */
export interface LeaderSlot {
  key: string
  name_ko: string
  name_en?: string | null
  role_ko: string
  role_en?: string | null
  photo_url?: string | null
  headline_ko?: string | null
  headline_en?: string | null
  status: 'current' | 'emeritus'
  /** church_people 에 같은 분이 있으면 그 기록 — 인물 시트를 열 수 있다 */
  person: Person | null
}

/** 공백·가운뎃점 차이를 무시하고 이름을 견주기 위한 키 */
const nameKey = (value: string): string => value.replace(/[\s·.]/g, '').toLowerCase()

const findLeaderPerson = (people: Person[], leader: LeaderCard): Person | null => {
  const keys = [leader.name_ko, leader.name_en]
    .map((value) => (typeof value === 'string' ? nameKey(value) : ''))
    .filter(Boolean)
  return (
    people.find(
      (person) => person.category === 'pastor' && keys.includes(nameKey(person.name_ko)),
    ) ?? null
  )
}

export const buildLeaderSlots = (people: Person[], leaders: LeaderCard[]): LeaderSlot[] => {
  const slots: LeaderSlot[] = leaders.map((leader) => {
    const person = findLeaderPerson(people, leader)
    return {
      key: `pastor-${leader.pastor_id}`,
      name_ko: leader.name_ko,
      name_en: leader.name_en,
      role_ko: leader.role_ko,
      role_en: leader.role_en,
      // 사진만은 인물 관리(/admin/people)에 올린 것이 우선이다 — 인사말의 사진은
      // 소개 글에 맞춘 컷이라 격자에 어울리지 않을 수 있어, 이 화면용 사진을
      // 따로 올릴 수 있게 둔다. 없으면 인사말 사진으로 폴백.
      photo_url: person?.photo_url || leader.photo_url,
      headline_ko: leader.headline_ko,
      headline_en: leader.headline_en,
      status: leader.status,
      person,
    }
  })

  // church_pastors 에 없는 담임·원로(= 인사말 없이 교역자로만 등록된 분)도 같은 줄에
  people.forEach((person) => {
    if (person.category !== 'pastor' || !looksLikeLeaderRole(person)) return
    if (slots.some((slot) => slot.person?.id === person.id)) return
    const role = person.role_ko || person.group_ko || '목사'
    slots.push({
      key: `person-${person.id}`,
      name_ko: person.name_ko,
      name_en: person.name_en,
      role_ko: role,
      role_en: person.role_en,
      photo_url: person.photo_url,
      headline_ko: person.bio_ko,
      headline_en: person.bio_en,
      status: role.includes('원로') ? 'emeritus' : 'current',
      person,
    })
  })

  // 원로가 왼쪽, 담임이 오른쪽 — 레거시 홈페이지의 예우 순서 (sort 는 안정 정렬)
  return slots.sort((a, b) => (a.status === b.status ? 0 : a.status === 'emeritus' ? -1 : 1))
}

/** 대표 줄로 올라간 분을 교역자 격자에서 뺀 나머지 */
export const withoutLeaderPeople = (people: Person[], slots: LeaderSlot[]): Person[] => {
  const taken = new Set(slots.map((slot) => slot.person?.id).filter((id): id is number => !!id))
  return taken.size === 0 ? people : people.filter((person) => !taken.has(person.id))
}
