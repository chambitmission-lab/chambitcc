// 섬기는 사람들 관리 — 인물 기록에서 '채운 정보'를 따진다 (PeopleDesk · PeopleManagement 공용)
import { CATEGORY_DATE_LABEL } from '../../../types/people'
import type { Person } from '../../../types/people'
import type { PersonComposerStep } from './PersonComposer'

// ── 채운 정보 ────────────────────────────────────────────
// key: 성도 화면에서 비어 보이는 것(명단에 '빠짐'으로 표시) / 나머지는 있으면 좋은 것

export interface PersonCheck {
  label: string
  done: boolean
  key: boolean
  step: PersonComposerStep
}

const has = (v?: string | null) => !!v && v.trim().length > 0

export const personChecks = (p: Person): PersonCheck[] => {
  const missionary = p.category === 'missionary'
  const list: PersonCheck[] = [
    { label: '사진', done: has(p.photo_url), key: true, step: 'basic' },
    { label: '직분', done: has(p.role_ko), key: false, step: 'basic' },
  ]
  if (missionary) {
    list.push(
      { label: '사역지', done: has(p.field_ko), key: true, step: 'contact' },
      { label: '국가', done: has(p.country_code), key: true, step: 'contact' },
      { label: '파송기관', done: has(p.org_ko), key: false, step: 'contact' },
    )
  } else {
    list.push({ label: '담당 사역', done: has(p.assignments_ko), key: p.category === 'pastor', step: 'ministry' })
  }
  list.push(
    { label: '소개', done: has(p.bio_ko), key: false, step: 'ministry' },
    { label: '삶의 말씀', done: has(p.verse_ko), key: false, step: 'ministry' },
    { label: `${CATEGORY_DATE_LABEL[p.category].ko}일`, done: has(p.started_on), key: false, step: 'ministry' },
    { label: '연락처', done: has(p.phone) || has(p.email), key: false, step: 'contact' },
    { label: '영문 이름', done: has(p.name_en), key: false, step: 'basic' },
  )
  return list
}

export const missingKeyLabels = (p: Person) => personChecks(p).filter((c) => c.key && !c.done).map((c) => c.label)

