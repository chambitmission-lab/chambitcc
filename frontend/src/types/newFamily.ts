// 새가족 등록 앨범 타입
// 댓글(NewFamilyComment)은 기도 댓글(Reply)과 구조가 동일해
// 공용 ReplyList / ReplyComposer 컴포넌트를 그대로 재사용한다.

/** 환영 리액션 이모지 — 백엔드 schemas/new_family.py WELCOME_EMOJIS와 동일하게 유지 */
export const WELCOME_EMOJIS = ['👋', '❤️', '🙌', '🎉'] as const
export type WelcomeEmoji = (typeof WELCOME_EMOJIS)[number]

export interface NewFamilyPhoto {
  id: number
  image_url: string
  sort_order: number
}

export interface NewFamilyPost {
  id: number
  member_name: string
  /** 등록 주일 (YYYY-MM-DD) */
  registered_at: string
  group_name: string | null
  greeting: string | null

  photos: NewFamilyPhoto[]
  cover_url: string | null
  photo_count: number

  welcome_count: number
  /** { "👋": 3, "❤️": 5 } — 0인 이모지는 생략됨 */
  welcome_breakdown: Record<string, number>
  /** 내가 누른 이모지 (없으면 null) */
  my_welcome: string | null

  comment_count: number
  is_published: boolean

  created_at: string
  time_ago: string
}

export interface NewFamilyStats {
  this_month: number
  this_year: number
  total: number
}

export interface NewFamilyListResponse {
  success: boolean
  data: {
    items: NewFamilyPost[]
    page: number
    limit: number
    total: number
  }
}

export interface WelcomeToggleResponse {
  success: boolean
  my_welcome: string | null
  welcome_count: number
  welcome_breakdown: Record<string, number>
}

/** 기도 댓글(Reply)과 동일 구조 — ReplyList에 그대로 넘길 수 있다 */
export interface NewFamilyComment {
  id: number
  display_name: string
  avatar_url?: string | null
  content: string
  created_at: string
  time_ago: string
  is_owner?: boolean
  is_edited?: boolean
}

export interface NewFamilyCommentListResponse {
  success: boolean
  data: {
    items: NewFamilyComment[]
    page: number
    limit: number
  }
}

export interface NewFamilyPostUpdatePayload {
  member_name?: string
  registered_at?: string
  group_name?: string | null
  greeting?: string | null
  is_published?: boolean
}
