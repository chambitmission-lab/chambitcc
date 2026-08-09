// 목양컬럼 관련 타입 정의

export interface Column {
  id?: number
  title: string
  title_en?: string
  author: string
  author_en?: string
  role: string
  role_en?: string
  date: string
  content: string
  content_en?: string
  image?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  // 참여 지표 — amen_count/read_count는 전체 집계,
  // is_amened/is_read는 로그인한 본인의 상태 (비로그인은 항상 false)
  amen_count?: number
  read_count?: number
  is_amened?: boolean
  is_read?: boolean
}

// 아멘 토글 / 완독 기록 응답
export interface ColumnEngagement {
  amen_count: number
  read_count: number
  is_amened: boolean
  is_read: boolean
}

export interface CreateColumnRequest {
  title: string
  title_en?: string
  author: string
  author_en?: string
  role: string
  role_en?: string
  date: string
  content: string
  content_en?: string
  image?: string
}

export interface UpdateColumnRequest {
  title?: string
  title_en?: string
  author?: string
  author_en?: string
  role?: string
  role_en?: string
  date?: string
  content?: string
  content_en?: string
  image?: string
  is_active?: boolean
}
