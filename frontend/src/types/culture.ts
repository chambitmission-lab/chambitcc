// 문화교실 타입 정의

/** 수업 계획표 한 주 — 주차 번호는 순서로 매긴다 */
export interface CultureCurriculumRow {
  title: string
  note: string
}

/** 자유 꼭지 — text 글 · list 줄마다 한 항목 · quote 강조 문구 · image 사진+설명 */
export type CultureSectionType = 'text' | 'list' | 'quote' | 'image'

export interface CultureDetailSection {
  type: CultureSectionType
  title: string
  body: string
  image_url?: string | null
}

/** 강좌 상세 — 기본 틀(대표 사진·대상·기간·강사 소개·수업 계획표) + 자유 꼭지 */
export interface CultureClassDetail {
  cover_image_url?: string | null
  /** 강좌 대표 색 #rrggbb — 없으면 강좌명으로 고른 색 */
  accent?: string | null
  target?: string | null
  duration?: string | null
  /** 줄마다 경력 한 줄 */
  instructor_bio?: string | null
  curriculum: CultureCurriculumRow[]
  sections: CultureDetailSection[]
}

export interface CultureClass {
  id: number
  title: string
  description?: string | null
  instructor?: string | null
  schedule?: string | null
  fee?: string | null
  capacity?: number | null
  location?: string | null
  quarter?: string | null
  /** 구버전 백엔드 응답·기존 강좌엔 없을 수 있음 */
  detail?: CultureClassDetail | null
  is_open: boolean
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  /** 취소 제외 신청자 수 — 구버전 백엔드 응답엔 없을 수 있음 */
  application_count?: number
}

export interface CultureClassAdmin extends CultureClass {
  application_count: number
}

export interface CreateCultureClassRequest {
  title: string
  description?: string
  instructor?: string
  schedule?: string
  fee?: string
  capacity?: number | null
  location?: string
  quarter?: string
  detail?: CultureClassDetail
  is_open?: boolean
  is_active?: boolean
  display_order?: number
}

export type UpdateCultureClassRequest = Partial<CreateCultureClassRequest>

export type CultureApplicationStatus = 'pending' | 'confirmed' | 'cancelled'

export interface CultureApplication {
  id: number
  class_id: number
  name: string
  phone: string
  birth_date: string
  gender?: string | null
  memo?: string | null
  status: CultureApplicationStatus
  created_at: string
  class_title?: string | null
}

export interface CreateCultureApplicationRequest {
  class_id: number
  name: string
  phone: string
  birth_date: string
  gender?: string
  memo?: string
}

export interface CultureApplicationLookupRequest {
  phone: string
  birth_date: string
}

export interface CultureNotice {
  id: number
  title: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCultureNoticeRequest {
  title: string
  content: string
  is_active?: boolean
}

export type UpdateCultureNoticeRequest = Partial<CreateCultureNoticeRequest>
