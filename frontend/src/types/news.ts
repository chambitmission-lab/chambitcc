// 교회소식 게시판 타입 (백엔드 app/schemas/news.py 와 1:1)
// 레거시 홈페이지의 "교회소식" 게시판을 옮긴 것 — 관리자가 올리고 누구나 읽는다.

export interface NewsAttachment {
  id: number
  /** 'image' = 본문에 펼쳐 보여주는 사진, 'file' = 내려받는 문서 */
  kind: 'image' | 'file'
  url: string
  filename: string | null
  content_type: string | null
  /** bytes */
  file_size: number | null
  sort_order: number
}

export interface NewsItem {
  id: number
  title: string
  /** 본문 앞부분 요약(서버 생성) — 목록 카드용 */
  summary: string
  category: string | null
  author: string | null
  thumbnail_url: string | null
  views: number
  is_published: boolean
  is_pinned: boolean
  image_count: number
  file_count: number
  /** 게시일 (없으면 등록일) */
  published_at: string | null
  created_at: string | null
}

export interface NewsDetail extends NewsItem {
  content: string
  attachments: NewsAttachment[]
}

export interface NewsListResponse {
  success: boolean
  data: {
    items: NewsItem[]
    page: number
    limit: number
    total: number
  }
}

/** 관리자 등록/수정 폼 값 */
export interface NewsFormPayload {
  title: string
  content: string
  category?: string
  author?: string
  isPublished: boolean
  isPinned: boolean
  /** YYYY-MM-DD */
  publishedAt?: string
  /** 새로 올리는 이미지 (리사이즈된 Blob) */
  images: Blob[]
  /** 새로 올리는 문서 첨부 */
  files: File[]
  /** 수정 시 유지할 기존 첨부 id — 없으면 전부 유지 */
  keepAttachmentIds?: number[]
}
