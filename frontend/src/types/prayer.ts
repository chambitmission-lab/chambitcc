// 주간 기도 스토리 감정 키 (백엔드 ALLOWED_EMOTIONS와 동기화)
export type PrayerEmotion =
  | 'tired'
  | 'anxious'
  | 'grateful'
  | 'sad'
  | 'lonely'
  | 'angry'
  | 'hopeful'
  | 'confused'

// Prayer 관련 타입 정의
export interface Prayer {
  id: number
  display_name: string
  avatar_url?: string | null // 작성자 프로필 사진 (익명/별명이면 null)
  title?: string | null  // 제목 (선택 — 없으면 내용만)
  content: string
  title_en?: string  // 한글→영어 번역 제목
  content_en?: string  // 한글→영어 번역 내용
  title_ko?: string  // 영어→한글 번역 제목
  content_ko?: string  // 영어→한글 번역 내용
  original_language?: string  // 원본 언어 코드 (ko, en, vi 등)
  prayer_count: number
  reply_count: number
  is_prayed: boolean
  is_owner?: boolean  // 내가 작성한 기도인지
  is_answered?: boolean  // 기도 응답 여부
  answered_at?: string  // 응답 시간
  testimony?: string  // 간증 내용
  emotion?: PrayerEmotion  // 감정 태그 (주간 스토리용)
  created_at: string
  time_ago: string
  recommended_verses?: RecommendedVerses  // 성경 구절 추천
  group_id?: number  // 소그룹 ID (null이면 전체 공개)
  group?: PrayerGroup  // 소그룹 정보
}

export interface PrayerDetailResponse {
  success: boolean
  data: Prayer
}

export interface PrayerListResponse {
  success: boolean
  data: {
    items: Prayer[]
    page: number
    limit: number
    total: number       // 필터 기준 전체 건수
    has_next?: boolean  // 다음 페이지 존재 여부 (구버전 백엔드 응답에는 없을 수 있음)
  }
}

export interface CreatePrayerRequest {
  title?: string  // 제목 (선택)
  content: string
  display_name?: string  // 선택 (기본값: "익명")
  is_fully_anonymous: boolean
  group_id?: number  // 소그룹 ID (선택)
  emotion?: PrayerEmotion  // 감정 태그 (선택)
}

// 성경 구절 추천 타입
export interface BibleVerse {
  reference: string  // 예: "마태복음 11:28"
  text: string       // 성경 구절 내용
  message: string    // 적용 메시지
}

export interface RecommendedVerses {
  summary: string           // 기도 주제 요약
  verses: BibleVerse[]      // 추천 성경 구절 목록
  language: string          // 언어 코드 (ko, en 등)
}

export interface PrayerResponse {
  success: boolean
  message: string
  data: Prayer  // 이제 prayer 객체가 바로 data에 있음
  processing?: boolean  // 백그라운드 처리 중 여부
}

export type SortType = 'popular' | 'latest'

export type PrayerFilterType = 'all' | 'my_prayers' | 'prayed_by_me'

// Reply 관련 타입 정의
export interface Reply {
  id: number
  display_name: string
  avatar_url?: string | null // 작성자 프로필 사진 (익명/별명이면 null)
  content: string
  created_at: string
  time_ago: string
  is_owner?: boolean   // 내가 작성한 댓글 여부 (로그인 시)
  is_edited?: boolean  // 수정된 댓글 여부
}

export interface ReplyListResponse {
  success: boolean
  data: {
    items: Reply[]
    page: number
    limit: number
  }
}

export interface CreateReplyRequest {
  content: string
  display_name?: string  // 선택 (기본값: "익명")
}

export interface UpdateReplyRequest {
  content: string
}

export interface ReplyResponse {
  success: boolean
  message: string
  data: Reply
}

// 소그룹(기도방) 관련 타입 정의
export interface GroupTheme {
  id: number  // 상황별 성구 카테고리 id
  name: string
  icon: string  // material icon name
  color: string  // hex
}

export interface GroupThemeVerse {
  book_name_ko: string
  chapter: number
  verse: number
  text: string
}

export interface PrayerGroup {
  id: number
  name: string
  description?: string
  icon?: string  // 이모지 또는 아이콘 이름
  member_count: number
  prayer_count: number
  answered_count?: number  // 응답된 기도 수
  prayed_count?: number  // '함께 기도했어요' 총 횟수 (상세에서만)
  theme?: GroupTheme | null
  theme_verse?: GroupThemeVerse | null  // 오늘의 성구 (상세에서만)
  is_member: boolean
  is_admin: boolean
  created_at: string
  invite_code?: string  // 관리자만 볼 수 있음
}

// 초대 링크 랜딩용 미리보기
export interface PrayerGroupPreview {
  id: number
  name: string
  description?: string
  icon?: string
  member_count: number
  prayer_count: number
  answered_count: number
  member_names: string[]
  theme?: GroupTheme | null
  theme_verse?: GroupThemeVerse | null
  is_member: boolean
}

export interface GroupListResponse {
  success: boolean
  data: {
    items: PrayerGroup[]
    total: number
  }
}

export interface CreateGroupRequest {
  name: string
  description?: string
  icon?: string
  theme_category_id?: number | null
}

export interface JoinGroupRequest {
  invite_code: string
}

export interface GroupMember {
  id: number
  username: string
  display_name: string
  is_admin: boolean
  joined_at: string
}

export interface GroupMembersResponse {
  success: boolean
  data: {
    items: GroupMember[]
    total: number
  }
}
