// 주보 타입 정의

export interface BulletinPage {
  page_number: number
  image_url: string  // 이미지 URL
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
  page_count: number
  thumbnail_url: string
  pages?: BulletinPage[]  // 상세 조회시에만 포함
}

export interface BulletinsResponse {
  bulletins: Bulletin[]
  total: number
}
