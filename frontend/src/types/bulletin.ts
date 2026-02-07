// 주보 타입 정의

export interface BulletinPage {
  page_number: number
  image_data: string  // base64 encoded image
  image_type: string  // image/jpeg, image/png 등
}

export interface Bulletin {
  id: number
  title: string
  description: string
  bulletin_date: string
  created_at: string
  updated_at?: string
  pages: BulletinPage[]
}

export interface CreateBulletinRequest {
  title: string
  description: string
  bulletin_date: string
  pages: BulletinPage[]
}

export interface BulletinsResponse {
  bulletins: Bulletin[]
  total: number
}
