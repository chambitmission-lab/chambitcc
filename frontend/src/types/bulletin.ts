// 주보 타입 정의

export interface BulletinPage {
  id: number
  bulletin_id: number
  page_number: number
  image_url: string
  created_at: string
}

export interface Bulletin {
  id: number
  title: string
  description: string
  bulletin_date: string
  views: number
  is_published: number
  created_at: string
  updated_at: string
  page_count?: number  // 목록 조회시에만 포함
  thumbnail_url?: string  // 목록 조회시에만 포함
  pages?: BulletinPage[]  // 상세 조회시에만 포함
}

/** 주보 정보 수정 payload — 보낸 필드만 갱신된다 */
export interface BulletinUpdatePayload {
  title?: string
  description?: string
  bulletin_date?: string
  is_published?: number
}

export interface BulletinsResponse {
  bulletins: Bulletin[]
  total: number
}
