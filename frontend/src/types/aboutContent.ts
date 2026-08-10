// 소개 페이지 인라인 편집 컨텐츠 타입

import type { about as aboutKo } from '../locales/ko/about'
import type { visit as visitKo } from '../locales/ko/visit'

// 백엔드 about_content.fields 는 화이트리스트 없는 Dict[str, LocalizedValue] 라
// 네임스페이스를 늘려도 서버 변경이 필요 없다 — /visit 도 같은 저장소를 함께 쓴다.
export type AboutFieldKey = keyof typeof aboutKo | keyof typeof visitKo

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
