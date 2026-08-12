// 행사 앨범 타입 (새가족 앨범 미러링 + 행사 필드)
// 댓글(EventAlbumComment)은 기도 댓글(Reply)과 구조가 동일해
// 공용 ReplyList / ReplyComposer 컴포넌트를 그대로 재사용한다.

/** 행사 리액션 이모지 — 백엔드 event_albums 화이트리스트와 동일하게 유지 */
export const EVENT_ALBUM_EMOJIS = ['🙏', '❤️', '🎉', '🙌'] as const
export type EventAlbumEmoji = (typeof EVENT_ALBUM_EMOJIS)[number]

/** 행사 태그 — 등록 시 pill grid, 목록에서 필터 칩으로 쓴다 */
export const EVENT_ALBUM_TAGS = [
  '부활절',
  '성탄',
  '추수감사',
  '수련회',
  '야유회',
  '예배',
  '절기',
  '기타',
] as const
export type EventAlbumTag = (typeof EVENT_ALBUM_TAGS)[number]

/** 태그 칩에 곁들일 이모지 아이콘 */
export const EVENT_ALBUM_TAG_EMOJI: Record<EventAlbumTag, string> = {
  부활절: '🌷',
  성탄: '🎄',
  추수감사: '🌾',
  수련회: '⛺',
  야유회: '🧺',
  예배: '⛪',
  절기: '🕊️',
  기타: '📷',
}

export const eventAlbumTagEmoji = (tag: string): string =>
  EVENT_ALBUM_TAG_EMOJI[tag as EventAlbumTag] ?? '📷'

export interface EventAlbumPhoto {
  id: number
  url: string
  sort_order: number
}

export interface EventAlbumPost {
  id: number
  title: string
  caption: string | null
  /** 행사 날짜 (YYYY-MM-DD) */
  event_date: string
  tag: string
  /** 연결된 일정(/events/:id). 없으면 null */
  event_id: number | null

  photos: EventAlbumPhoto[]
  cover_url: string | null
  photo_count: number

  reaction_count: number
  /** { "🙏": 3, "🎉": 5 } — 0인 이모지는 생략됨 */
  reaction_breakdown: Record<string, number>
  /** 내가 누른 이모지 (없으면 null) */
  my_reaction: string | null

  comment_count: number
  is_published: boolean

  created_at: string
  time_ago: string
}

export interface EventAlbumStats {
  total_posts: number
  total_photos: number
  years: number[]
  tags: Record<string, number>
}

export interface EventAlbumListResponse {
  success: boolean
  data: {
    items: EventAlbumPost[]
    page: number
    limit: number
    total: number
  }
}

export interface ReactionToggleResponse {
  success: boolean
  my_reaction: string | null
  reaction_count: number
  reaction_breakdown: Record<string, number>
}

/** 기도 댓글(Reply)과 동일 구조 — ReplyList에 그대로 넘길 수 있다 */
export interface EventAlbumComment {
  id: number
  display_name: string
  avatar_url?: string | null
  content: string
  created_at: string
  time_ago: string
  is_owner?: boolean
  is_edited?: boolean
}

export interface EventAlbumCommentListResponse {
  success: boolean
  data: {
    items: EventAlbumComment[]
    page: number
    limit: number
  }
}

export interface EventAlbumPostUpdatePayload {
  title?: string
  caption?: string | null
  event_date?: string
  tag?: string
  event_id?: number | null
  is_published?: boolean
}
