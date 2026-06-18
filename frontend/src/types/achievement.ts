// 업적 및 보상 시스템 타입 정의

import type { translations } from '../locales'

// 번역 키 타입 (locales/ko 의 flat 키). 컴포넌트에서 t(key)로 안전하게 사용.
export type TranslationKey = keyof typeof translations.ko

export type AchievementType = 'prayer_time' | 'bible_reading' | 'prayer_count' | 'streak' | 'community' | 'bible_note' | 'bible_highlight' | 'bluemarble_correct' | 'bluemarble_lap' | 'bluemarble_clear' | 'bluemarble_score'

export interface Achievement {
  id: string
  type: AchievementType
  /** 한글 원문 (fallback). 화면 표기는 titleKey 사용 */
  title: string
  /** 한글 원문 (fallback). 화면 표기는 descKey 사용 */
  description: string
  titleKey: TranslationKey
  descKey: TranslationKey
  requirement: number
  glowColor: string
  glowIntensity: number
  icon: string
  unlocked: boolean
  progress: number
}

export interface GlowLevel {
  level: number
  /** 한글 원문 (fallback). 화면 표기는 nameKey 사용 */
  name: string
  nameKey: TranslationKey
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

  // 묵상/북마크
  bookmarksCount: number // 하이라이트 개수
  notesCount: number // 묵상 노트 개수
  favoritesCount: number // 즐겨찾기 개수

  // 성경 보드게임 (블루마블)
  bluemarbleBestScore: number // 베스트 점수
  bluemarbleCorrectTotal: number // 누적 정답 수
  bluemarbleLapsTotal: number // 누적 바퀴 수 (전체 게임 합산)
  bluemarbleClearCount: number // 일주(완주) 횟수
}

export const GLOW_LEVELS: GlowLevel[] = [
  {
    level: 0,
    name: '새싹',
    nameKey: 'levelNameSprout',
    minPoints: 0,
    glowColor: 'rgba(156, 163, 175, 0.3)', // gray
    glowIntensity: 0.3,
    glowSize: 20,
    pulseSpeed: 3,
  },
  {
    level: 1,
    name: '불씨',
    nameKey: 'levelNameSpark',
    minPoints: 100,
    glowColor: 'rgba(251, 191, 36, 0.5)', // amber
    glowIntensity: 0.5,
    glowSize: 30,
    pulseSpeed: 2.5,
  },
  {
    level: 2,
    name: '작은 불꽃',
    nameKey: 'levelNameFlame',
    minPoints: 500,
    glowColor: 'rgba(249, 115, 22, 0.6)', // orange
    glowIntensity: 0.6,
    glowSize: 40,
    pulseSpeed: 2,
  },
  {
    level: 3,
    name: '타오르는 불',
    nameKey: 'levelNameBlazing',
    minPoints: 1500,
    glowColor: 'rgba(239, 68, 68, 0.7)', // red
    glowIntensity: 0.7,
    glowSize: 50,
    pulseSpeed: 1.8,
  },
  {
    level: 4,
    name: '뜨거운 열정',
    nameKey: 'levelNamePassion',
    minPoints: 3500,
    glowColor: 'rgba(168, 85, 247, 0.8)', // purple
    glowIntensity: 0.8,
    glowSize: 60,
    pulseSpeed: 1.5,
  },
  {
    level: 5,
    name: '신앙의 빛',
    nameKey: 'levelNameLight',
    minPoints: 8000,
    glowColor: 'rgba(59, 130, 246, 0.9)', // blue
    glowIntensity: 0.9,
    glowSize: 70,
    pulseSpeed: 1.2,
  },
  {
    level: 6,
    name: '천상의 광채',
    nameKey: 'levelNameGlory',
    minPoints: 20000,
    glowColor: 'rgba(255, 255, 255, 1)', // white
    glowIntensity: 1,
    glowSize: 80,
    pulseSpeed: 1,
  },
  {
    level: 7,
    name: '영원한 등불',
    nameKey: 'levelNameEternalLamp',
    minPoints: 40000,
    glowColor: 'rgba(250, 204, 21, 1)', // gold
    glowIntensity: 1,
    glowSize: 95,
    pulseSpeed: 0.9,
  },
  {
    level: 8,
    name: '구원의 별',
    nameKey: 'levelNameStarOfSalvation',
    minPoints: 80000,
    glowColor: 'rgba(236, 72, 153, 1)', // radiant pink
    glowIntensity: 1,
    glowSize: 110,
    pulseSpeed: 0.8,
  },
]

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'progress'>[] = [
  // 기도 시간 업적
  {
    id: 'prayer_time_30',
    type: 'prayer_time',
    title: '기도의 시작',
    description: '집중 기도 30분 달성',
    titleKey: 'achPrayerTime30T',
    descKey: 'achPrayerTime30D',
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
    titleKey: 'achPrayerTime100T',
    descKey: 'achPrayerTime100D',
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
    titleKey: 'achPrayerTime300T',
    descKey: 'achPrayerTime300D',
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
    titleKey: 'achBibleGenesisT',
    descKey: 'achBibleGenesisD',
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
    titleKey: 'achBible100T',
    descKey: 'achBible100D',
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
    titleKey: 'achBible500T',
    descKey: 'achBible500D',
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
    titleKey: 'achStreak7T',
    descKey: 'achStreak7D',
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
    titleKey: 'achStreak30T',
    descKey: 'achStreak30D',
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
    titleKey: 'achPrayerCount50T',
    descKey: 'achPrayerCount50D',
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
    titleKey: 'achPrayerCount200T',
    descKey: 'achPrayerCount200D',
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
    titleKey: 'achCommunityActiveT',
    descKey: 'achCommunityActiveD',
    requirement: 50,
    glowColor: 'rgba(168, 85, 247, 0.6)',
    glowIntensity: 0.6,
    icon: '💬',
  },

  // 묵상 노트 업적
  {
    id: 'bible_note_first',
    type: 'bible_note',
    title: '첫 묵상',
    description: '묵상 노트 1개 작성',
    titleKey: 'achBibleNoteFirstT',
    descKey: 'achBibleNoteFirstD',
    requirement: 1,
    glowColor: 'rgba(168, 85, 247, 0.6)',
    glowIntensity: 0.6,
    icon: '📝',
  },
  {
    id: 'bible_note_20',
    type: 'bible_note',
    title: '묵상의 습관',
    description: '묵상 노트 20개 작성',
    titleKey: 'achBibleNote20T',
    descKey: 'achBibleNote20D',
    requirement: 20,
    glowColor: 'rgba(139, 92, 246, 0.8)',
    glowIntensity: 0.8,
    icon: '✍️',
  },

  // 하이라이트 업적
  {
    id: 'bible_highlight_100',
    type: 'bible_highlight',
    title: '말씀의 정원',
    description: '구절 하이라이트 100개',
    titleKey: 'achBibleHighlight100T',
    descKey: 'achBibleHighlight100D',
    requirement: 100,
    glowColor: 'rgba(250, 204, 21, 0.9)',
    glowIntensity: 0.9,
    icon: '🌼',
  },

  // ============= 성경 보드게임(블루마블) 업적 =============
  {
    id: 'bm_correct_10',
    type: 'bluemarble_correct',
    title: '말씀 새내기',
    description: '보드게임 퀴즈 10문제 정답',
    titleKey: 'achBmCorrect10T',
    descKey: 'achBmCorrect10D',
    requirement: 10,
    glowColor: 'rgba(52, 211, 153, 0.6)',
    glowIntensity: 0.6,
    icon: '🎯',
  },
  {
    id: 'bm_correct_50',
    type: 'bluemarble_correct',
    title: '말씀 박사',
    description: '보드게임 퀴즈 50문제 정답',
    titleKey: 'achBmCorrect50T',
    descKey: 'achBmCorrect50D',
    requirement: 50,
    glowColor: 'rgba(34, 197, 94, 0.8)',
    glowIntensity: 0.8,
    icon: '🧠',
  },
  {
    id: 'bm_lap_3',
    type: 'bluemarble_lap',
    title: '여행자의 발자취',
    description: '보드 한 바퀴 3회 달성',
    titleKey: 'achBmLap3T',
    descKey: 'achBmLap3D',
    requirement: 3,
    glowColor: 'rgba(96, 165, 250, 0.7)',
    glowIntensity: 0.7,
    icon: '👣',
  },
  {
    id: 'bm_clear_1',
    type: 'bluemarble_clear',
    title: '성경 일주',
    description: '보드게임 첫 완주',
    titleKey: 'achBmClear1T',
    descKey: 'achBmClear1D',
    requirement: 1,
    glowColor: 'rgba(251, 191, 36, 0.9)',
    glowIntensity: 0.9,
    icon: '🏆',
  },
  {
    id: 'bm_score_1000',
    type: 'bluemarble_score',
    title: '믿음의 챔피언',
    description: '베스트 점수 1,000점 달성',
    titleKey: 'achBmScore1000T',
    descKey: 'achBmScore1000D',
    requirement: 1000,
    glowColor: 'rgba(236, 72, 153, 0.8)',
    glowIntensity: 0.8,
    icon: '⭐',
  },
  {
    id: 'bm_score_3000',
    type: 'bluemarble_score',
    title: '말씀의 거장',
    description: '베스트 점수 3,000점 달성',
    titleKey: 'achBmScore3000T',
    descKey: 'achBmScore3000D',
    requirement: 3000,
    glowColor: 'rgba(168, 85, 247, 0.9)',
    glowIntensity: 0.9,
    icon: '👑',
  },
]
