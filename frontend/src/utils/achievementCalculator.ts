import type { UserActivityData, Achievement, GlowLevel } from '../types/achievement'
import { ACHIEVEMENTS, GLOW_LEVELS } from '../types/achievement'

/**
 * 사용자 활동 데이터를 기반으로 포인트 계산
 */
export const calculateActivityPoints = (activity: UserActivityData): number => {
  let points = 0

  // 기도 횟수: 1회당 10포인트
  points += activity.totalPrayerCount * 10

  // 성경 구절 읽기: 1절당 3포인트
  points += activity.bibleVersesRead * 3

  // 성경 장 완독: 1장당 20포인트 (보너스)
  points += activity.bibleChaptersRead * 20

  // 성경 책 완독: 1권당 200포인트 (보너스)
  points += activity.bibleBooksCompleted.length * 200

  // 댓글: 1개당 10포인트
  points += activity.repliesCount * 10

  // 기도중인 항목: 1개당 5포인트
  points += activity.prayingForCount * 5

  // 연속 기도 일수: 1일당 5포인트
  points += activity.streakDays * 5

  // 구절 하이라이트: 1개당 5포인트
  points += activity.bookmarksCount * 5

  // 묵상 노트: 1개당 15포인트 (글을 쓰는 행위는 큰 가중치)
  points += activity.notesCount * 15

  // 즐겨찾기 구절: 1개당 3포인트
  points += activity.favoritesCount * 3

  // 성경 보드게임: 정답 1개당 8포인트, 1바퀴당 30포인트, 클리어 1회당 200포인트
  points += activity.bluemarbleCorrectTotal * 8
  points += activity.bluemarbleLapsTotal * 30
  points += activity.bluemarbleClearCount * 200
  // 베스트 점수의 10%를 추가 가산 (게임 내 점수도 GLOW에 기여)
  points += Math.floor(activity.bluemarbleBestScore * 0.1)

  return points
}

/**
 * 포인트를 기반으로 현재 글로우 레벨 계산
 */
export const calculateGlowLevel = (points: number): GlowLevel => {
  // 역순으로 검색하여 가장 높은 달성 레벨 찾기
  for (let i = GLOW_LEVELS.length - 1; i >= 0; i--) {
    if (points >= GLOW_LEVELS[i].minPoints) {
      return GLOW_LEVELS[i]
    }
  }
  return GLOW_LEVELS[0]
}

/**
 * 다음 레벨까지 필요한 포인트 계산
 */
export const getPointsToNextLevel = (currentPoints: number): { needed: number; total: number } | null => {
  const currentLevel = calculateGlowLevel(currentPoints)
  const currentIndex = GLOW_LEVELS.findIndex(l => l.level === currentLevel.level)
  
  if (currentIndex === GLOW_LEVELS.length - 1) {
    return null // 최고 레벨 달성
  }
  
  const nextLevel = GLOW_LEVELS[currentIndex + 1]
  return {
    needed: nextLevel.minPoints - currentPoints,
    total: nextLevel.minPoints - currentLevel.minPoints,
  }
}

/**
 * 업적 달성 여부 및 진행도 계산
 */
export const calculateAchievements = (activity: UserActivityData): Achievement[] => {
  return ACHIEVEMENTS.map(achievement => {
    let progress = 0
    let unlocked = false
    
    switch (achievement.type) {
      case 'prayer_time':
        progress = activity.totalPrayerTime
        unlocked = progress >= achievement.requirement
        break
        
      case 'bible_reading':
        progress = achievement.id === 'bible_genesis' 
          ? activity.bibleBooksCompleted.includes('창세기') ? 50 : 0
          : activity.bibleChaptersRead
        unlocked = progress >= achievement.requirement
        break
        
      case 'streak':
        progress = activity.streakDays
        unlocked = progress >= achievement.requirement
        break
        
      case 'prayer_count':
        progress = activity.totalPrayerCount
        unlocked = progress >= achievement.requirement
        break
        
      case 'community':
        progress = activity.repliesCount
        unlocked = progress >= achievement.requirement
        break

      case 'bible_note':
        progress = activity.notesCount
        unlocked = progress >= achievement.requirement
        break

      case 'bible_highlight':
        progress = activity.bookmarksCount
        unlocked = progress >= achievement.requirement
        break

      case 'bluemarble_correct':
        progress = activity.bluemarbleCorrectTotal
        unlocked = progress >= achievement.requirement
        break

      case 'bluemarble_lap':
        progress = activity.bluemarbleLapsTotal
        unlocked = progress >= achievement.requirement
        break

      case 'bluemarble_clear':
        progress = activity.bluemarbleClearCount
        unlocked = progress >= achievement.requirement
        break

      case 'bluemarble_score':
        progress = activity.bluemarbleBestScore
        unlocked = progress >= achievement.requirement
        break
    }
    
    return {
      ...achievement,
      progress,
      unlocked,
    }
  })
}

/**
 * 가장 최근에 해금된 업적 가져오기 (로컬스토리지 기반)
 */
export const getNewlyUnlockedAchievements = (
  currentAchievements: Achievement[]
): Achievement[] => {
  const storageKey = 'unlocked_achievements'
  const previousUnlocked = JSON.parse(localStorage.getItem(storageKey) || '[]') as string[]
  
  const newlyUnlocked = currentAchievements.filter(
    achievement => achievement.unlocked && !previousUnlocked.includes(achievement.id)
  )
  
  // 현재 해금된 업적 ID 저장
  const currentUnlocked = currentAchievements
    .filter(a => a.unlocked)
    .map(a => a.id)
  localStorage.setItem(storageKey, JSON.stringify(currentUnlocked))
  
  return newlyUnlocked
}
