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
