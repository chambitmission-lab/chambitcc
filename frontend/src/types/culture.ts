// 문화교실 타입 정의

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
  is_open: boolean
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
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
