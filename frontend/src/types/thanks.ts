// 오늘의 감사 (Small Thanks Thread) 타입 정의

export type ThanksEmotion = 'joy' | 'peace' | 'awe' | 'love' | 'laugh'

interface ThanksEmotionMeta {
  label: string
  labelEn: string
  /** 감정 액센트 색 — 브랜드 블루를 덮지 않고 카드 tint/아이콘 후광에만 얹는 기능색 */
  hue: string
  /** 고르면 뜨는 한 줄 — "무슨 얘길 적으면 되지?"를 풀어주는 힌트 */
  hint: string
  hintEn: string
}

/**
 * 감정 메타 — 그림은 이모지가 아니라 components/icons/ThanksIcons.tsx의
 * <ThanksIcon name={emotionKey} />가 그린다(키 이름이 곧 아이콘 이름).
 */
export const THANKS_EMOTIONS: Record<ThanksEmotion, ThanksEmotionMeta> = {
  joy: {
    label: '기쁨',
    labelEn: 'Joy',
    hue: '#f2a13c',
    hint: '입꼬리가 슬쩍 올라갔던 순간',
    hintEn: 'The moment your smile snuck out',
  },
  peace: {
    label: '평안',
    labelEn: 'Peace',
    hue: '#2fa8a0',
    hint: '어깨에 힘이 풀렸던 순간',
    hintEn: 'When your shoulders finally dropped',
  },
  awe: {
    label: '감격',
    labelEn: 'Awe',
    hue: '#4593fc',
    hint: '괜히 코끝이 찡했던 순간',
    hintEn: 'When something quietly moved you',
  },
  love: {
    label: '사랑',
    labelEn: 'Love',
    hue: '#ef6f96',
    hint: '누군가 얼굴이 떠오르는 순간',
    hintEn: 'When someone came to mind',
  },
  laugh: {
    label: '웃음',
    labelEn: 'Laugh',
    hue: '#ff8a3d',
    hint: '혼자 빵 터졌던 순간',
    hintEn: 'That thing you laughed at alone',
  },
}

export interface Thanks {
  id: number
  user_id: number
  display_name: string
  avatar_url?: string | null // 작성자 프로필 사진 (미등록/별명이면 null)
  content: string
  emotion?: ThanksEmotion | null
  amen_count: number
  is_mine: boolean
  is_amened: boolean
  created_at: string
  time_ago: string
}

export interface ThanksListResponse {
  success: boolean
  data: {
    items: Thanks[]
    page: number
    limit: number
    total: number
    /** 감사를 남긴 사람 수 (중복 제거) — 히어로 아바타 스택 "+N"용 */
    author_count?: number
  }
}

export interface CreateThanksRequest {
  content: string
  emotion?: ThanksEmotion | null
}

export interface ThanksDetailResponse {
  success: boolean
  message?: string
  data: Thanks
}

export interface ThanksAmenResponse {
  success: boolean
  is_amened: boolean
  amen_count: number
}

export interface ThanksWeeklyTopResponse {
  success: boolean
  data: {
    /** 이번 주 아멘 상위 감사 */
    items: Thanks[]
    /** 이번 주(KST 월요일부터) 올라온 감사 수 */
    week_count: number
  }
}
