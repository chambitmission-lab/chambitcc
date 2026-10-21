import type { UserActivityData, Achievement, AchievementType, GlowLevel } from '../types/achievement'
import { ACHIEVEMENTS, GLOW_LEVELS } from '../types/achievement'
import { safeStorage } from './safeStorage'

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
 * 업적 종류별 진행도 — 활동 데이터에서 어느 숫자를 보는지.
 * 종류를 추가하면 types/achievement 의 AchievementType 과 함께 여기 한 줄만 늘린다(빠뜨리면 컴파일이 막는다).
 * 달성 여부는 아래 calculateAchievements 가 requirement 와 비교해 한 번에 정한다.
 */
const PROGRESS_OF: Record<AchievementType, (activity: UserActivityData, achievement: Pick<Achievement, 'bookNumber'>) => number> = {
  prayer_time: (a) => a.totalPrayerTime,
  // bookNumber가 있으면 그 책에서 읽은 장 수(부분 진행도), 없으면 전체 읽은 장 수.
  // 과거에는 완독 여부만 보고 0 또는 requirement로 튀어서 진행바가 항상 0이었다.
  bible_reading: (a, ach) =>
    ach.bookNumber !== undefined ? a.bibleBookChapters[String(ach.bookNumber)] ?? 0 : a.bibleChaptersRead,
  streak: (a) => a.streakDays,
  prayer_count: (a) => a.totalPrayerCount,
  community: (a) => a.repliesCount,
  bible_note: (a) => a.notesCount,
  bible_highlight: (a) => a.bookmarksCount,
  bluemarble_correct: (a) => a.bluemarbleCorrectTotal,
  bluemarble_lap: (a) => a.bluemarbleLapsTotal,
  bluemarble_clear: (a) => a.bluemarbleClearCount,
  bluemarble_score: (a) => a.bluemarbleBestScore,
}

/**
 * 업적 달성 여부 및 진행도 계산
 */
export const calculateAchievements = (activity: UserActivityData): Achievement[] =>
  ACHIEVEMENTS.map(achievement => {
    const progress = PROGRESS_OF[achievement.type](activity, achievement)
    return {
      ...achievement,
      progress,
      unlocked: progress >= achievement.requirement,
    }
  })

/**
 * 가장 최근에 해금된 업적 가져오기 (로컬스토리지 기반)
 */
export const getNewlyUnlockedAchievements = (
  currentAchievements: Achievement[]
): Achievement[] => {
  const storageKey = 'unlocked_achievements'
  // 저장값이 손상돼 있어도 렌더 중 throw 하지 않도록 방어 (파싱 실패 시 빈 목록으로 재시작,
  // 손상된 값은 아래에서 정상값으로 덮어써진다)
  const parsed = safeStorage.getJson(storageKey)
  const previousUnlocked: string[] = Array.isArray(parsed) ? parsed : []
  
  const newlyUnlocked = currentAchievements.filter(
    achievement => achievement.unlocked && !previousUnlocked.includes(achievement.id)
  )

  // 저장은 기존 목록과의 합집합으로 — "현재 해금"만으로 덮어쓰면
  // 오래된 캐시(persist 복원본 등)로 계산된 순간 기존 항목이 빠지고,
  // 신선한 데이터가 도착할 때 같은 업적이 매번 "새 해금"으로 재등장한다.
  // 한 번 확인한 업적은 영구히 본 것으로 취급한다.
  const currentUnlocked = currentAchievements
    .filter(a => a.unlocked)
    .map(a => a.id)
  const merged = Array.from(new Set([...previousUnlocked, ...currentUnlocked]))
  // 저장 실패 시 다음 방문에 팝업이 한 번 더 뜰 수 있을 뿐, 동작은 유지
  safeStorage.setJson(storageKey, merged)

  return newlyUnlocked
}
