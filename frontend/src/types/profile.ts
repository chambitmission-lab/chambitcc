// 프로필 관련 타입 정의

export interface ProfileStats {
  user_id: number
  username: string
  full_name: string
  avatar_url?: string | null // 프로필 사진 (미등록 시 null → 이니셜 아바타)
  activity: {
    this_week_count: number
    total_count: number
    streak_days: number
    total_prayer_time?: number // 분 단위 (선택적, 향후 API 추가)
  }
  content: {
    my_prayers: number
    praying_for: number
    my_replies: number
    // 누적(포인트 계산용) — 기도/댓글이 삭제되거나 함께 기도를 취소해도 깎이지 않음.
    // 구버전 백엔드에는 없을 수 있으므로 optional (없으면 현재 개수로 폴백)
    praying_for_total?: number
    my_replies_total?: number
  }
  bible_reading?: {
    verses_read: number // 읽은 구절 수
    chapters_read: number // 완독한 장 수
    books_completed: string[] // 완독한 책 목록
    // 책별 읽은 장 수 { book_number: read_chapters }. 읽은 적 있는 책만 포함.
    // JSON 키는 문자열이므로 조회 시 String(bookNumber) 로 접근할 것.
    books_progress?: Record<string, number>
    bookmarks_count?: number // 하이라이트 개수
    notes_count?: number // 묵상 노트 개수
    favorites_count?: number // 즐겨찾기 개수
    // 누적(포인트 계산용) — 삭제해도 깎이지 않는 '한 번이라도 한' 개수
    bookmarks_earned?: number
    notes_earned?: number
    favorites_earned?: number
  }
}

export interface MyPrayer {
  id: number
  title?: string | null  // 제목은 선택
  content: string
  prayer_count: number
  reply_count: number
  created_at: string
  is_active: boolean
}

export interface PrayingFor {
  id: number
  title?: string | null  // 제목은 선택
  content: string
  display_name: string
  prayer_count: number
  prayed_at: string
}

export interface MyReply {
  id: number
  prayer_id: number
  prayer_title?: string | null  // 제목은 선택
  content: string
  display_name: string
  created_at: string
}

export interface ProfileDetail {
  stats: ProfileStats
  my_prayers: MyPrayer[]
  praying_for: PrayingFor[]
  my_replies: MyReply[]
}

export type ProfileTab = 'prayers' | 'praying' | 'replies' | 'notes'
