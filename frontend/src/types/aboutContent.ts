// 소개 페이지 인라인 편집 컨텐츠 타입

import type { about as aboutKo } from '../locales/ko/about'

export type AboutFieldKey = keyof typeof aboutKo

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
