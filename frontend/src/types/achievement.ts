// 업적 및 보상 시스템 타입 정의

export type AchievementType = 'prayer_time' | 'bible_reading' | 'prayer_count' | 'streak' | 'community'

export interface Achievement {
  id: string
  type: AchievementType
  title: string
  description: string
  requirement: number
  glowColor: string
  glowIntensity: number
  icon: string
  unlocked: boolean
  progress: number
}

export interface GlowLevel {
  level: number
  name: string
  minPoints: number
  glowColor: string
  glowIntensity: number
  glowSize: number
  pulseSpeed: number
}

export interface UserActivityData {
  // 기도 활동
  totalPrayerTime: number // 분 단위
  totalPrayerCount: number
  streakDays: number
  
  // 성경 읽기
  bibleVersesRead: number // 읽은 구절 수
  bibleChaptersRead: number // 완독한 장 수
  bibleBooksCompleted: string[] // 완독한 책 목록
  
  // 커뮤니티 활동
  repliesCount: number
  prayingForCount: number
}

export const GLOW_LEVELS: GlowLevel[] = [
  {
    level: 0,
    name: '새싹',
    minPoints: 0,
    glowColor: 'rgba(156, 163, 175, 0.3)', // gray
    glowIntensity: 0.3,
    glowSize: 20,
    pulseSpeed: 3,
  },
  {
    level: 1,
    name: '불씨',
    minPoints: 50,
    glowColor: 'rgba(251, 191, 36, 0.5)', // amber
    glowIntensity: 0.5,
    glowSize: 30,
    pulseSpeed: 2.5,
  },
  {
    level: 2,
    name: '작은 불꽃',
    minPoints: 150,
    glowColor: 'rgba(249, 115, 22, 0.6)', // orange
    glowIntensity: 0.6,
    glowSize: 40,
    pulseSpeed: 2,
  },
  {
    level: 3,
    name: '타오르는 불',
    minPoints: 300,
    glowColor: 'rgba(239, 68, 68, 0.7)', // red
    glowIntensity: 0.7,
    glowSize: 50,
    pulseSpeed: 1.8,
  },
  {
    level: 4,
    name: '뜨거운 열정',
    minPoints: 500,
    glowColor: 'rgba(168, 85, 247, 0.8)', // purple
    glowIntensity: 0.8,
    glowSize: 60,
    pulseSpeed: 1.5,
  },
  {
    level: 5,
    name: '신앙의 빛',
    minPoints: 1000,
    glowColor: 'rgba(59, 130, 246, 0.9)', // blue
    glowIntensity: 0.9,
    glowSize: 70,
    pulseSpeed: 1.2,
  },
  {
    level: 6,
    name: '천상의 광채',
    minPoints: 2000,
    glowColor: 'rgba(255, 255, 255, 1)', // white
    glowIntensity: 1,
    glowSize: 80,
    pulseSpeed: 1,
  },
]

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'progress'>[] = [
  // 기도 시간 업적
  {
    id: 'prayer_time_30',
    type: 'prayer_time',
    title: '기도의 시작',
    description: '집중 기도 30분 달성',
    requirement: 30,
    glowColor: 'rgba(251, 191, 36, 0.6)',
    glowIntensity: 0.5,
    icon: '🕯️',
  },
  {
    id: 'prayer_time_100',
    type: 'prayer_time',
    title: '기도 전사',
    description: '집중 기도 100분 달성',
    requirement: 100,
    glowColor: 'rgba(249, 115, 22, 0.7)',
    glowIntensity: 0.7,
    icon: '🔥',
  },
  {
    id: 'prayer_time_300',
    type: 'prayer_time',
    title: '기도의 거장',
    description: '집중 기도 300분 달성',
    requirement: 300,
    glowColor: 'rgba(239, 68, 68, 0.8)',
    glowIntensity: 0.8,
    icon: '⚡',
  },
  
  // 성경 읽기 업적
  {
    id: 'bible_genesis',
    type: 'bible_reading',
    title: '창세기 완독',
    description: '창세기 50장 완독',
    requirement: 50,
    glowColor: 'rgba(34, 197, 94, 0.7)',
    glowIntensity: 0.7,
    icon: '📖',
  },
  {
    id: 'bible_100',
    type: 'bible_reading',
    title: '성경 탐험가',
    description: '성경 100장 읽기',
    requirement: 100,
    glowColor: 'rgba(59, 130, 246, 0.7)',
    glowIntensity: 0.7,
    icon: '📚',
  },
  {
    id: 'bible_500',
    type: 'bible_reading',
    title: '말씀의 수호자',
    description: '성경 500장 읽기',
    requirement: 500,
    glowColor: 'rgba(168, 85, 247, 0.8)',
    glowIntensity: 0.8,
    icon: '✨',
  },
  
  // 연속 기도 업적
  {
    id: 'streak_7',
    type: 'streak',
    title: '일주일의 헌신',
    description: '7일 연속 기도',
    requirement: 7,
    glowColor: 'rgba(236, 72, 153, 0.6)',
    glowIntensity: 0.6,
    icon: '🌟',
  },
  {
    id: 'streak_30',
    type: 'streak',
    title: '한 달의 신실함',
    description: '30일 연속 기도',
    requirement: 30,
    glowColor: 'rgba(236, 72, 153, 0.8)',
    glowIntensity: 0.8,
    icon: '💫',
  },
  
  // 기도 횟수 업적
  {
    id: 'prayer_count_50',
    type: 'prayer_count',
    title: '중보 기도자',
    description: '50번 기도하기',
    requirement: 50,
    glowColor: 'rgba(14, 165, 233, 0.6)',
    glowIntensity: 0.6,
    icon: '🙏',
  },
  {
    id: 'prayer_count_200',
    type: 'prayer_count',
    title: '기도의 용사',
    description: '200번 기도하기',
    requirement: 200,
    glowColor: 'rgba(14, 165, 233, 0.8)',
    glowIntensity: 0.8,
    icon: '⭐',
  },
  
  // 커뮤니티 업적
  {
    id: 'community_active',
    type: 'community',
    title: '함께하는 신앙',
    description: '댓글 50개 작성',
    requirement: 50,
    glowColor: 'rgba(168, 85, 247, 0.6)',
    glowIntensity: 0.6,
    icon: '💬',
  },
]
