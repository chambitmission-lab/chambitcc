// 소개 페이지 인라인 편집 컨텐츠 타입

import type { about as aboutKo } from '../locales/ko/about'
import type { visit as visitKo } from '../locales/ko/visit'
import type { landing as landingKo } from '../locales/ko/landing'
import type { greeting as greetingKo } from '../locales/ko/greeting'
import type { education as educationKo } from '../locales/ko/education'

// 백엔드 about_content.fields 는 화이트리스트 없는 Dict[str, LocalizedValue] 라
// 네임스페이스를 늘려도 서버 변경이 필요 없다 — /visit, /greeting 도 같은 저장소를 함께 쓴다.
// (/greeting 의 목사 개인 정보는 여기가 아니라 church_pastors 테이블에 있다 —
//  이 키들은 목사가 바뀌어도 그대로 남는 '페이지가 하는 말'뿐이다)
export type AboutFieldKey =
  | keyof typeof aboutKo
  | keyof typeof visitKo
  | keyof typeof landingKo
  | keyof typeof greetingKo
  | keyof typeof educationKo

export interface LocalizedValue {
  ko: string
  en: string
}

export type AboutFields = Partial<Record<AboutFieldKey, LocalizedValue>>

export interface AboutContent {
  fields: AboutFields
  hero_background_url?: string | null
  updated_at?: string
}

export interface UpdateAboutContentRequest {
  fields?: AboutFields
  hero_background_url?: string | null
}

export interface AboutImageUploadResponse {
  url: string
}
