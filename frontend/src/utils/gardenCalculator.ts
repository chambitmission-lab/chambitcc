// 정원 시스템 계산 로직

import type { 
  GardenFlower, 
  GardenStats, 
  MonthlyGarden, 
  LambStage,
  FlowerType 
} from '../types/garden'
import { 
  LAMB_STAGES, 
  BOOK_TO_FLOWER, 
  FLOWER_COLORS,
  FLOWER_EMOJIS 
} from '../types/garden'
import type { ReadVerse } from '../api/bibleReading'

/**
 * 포인트 기반으로 어린 양 단계 계산
 */
export const calculateLambStage = (points: number): LambStage => {
  for (let i = LAMB_STAGES.length - 1; i >= 0; i--) {
    if (points >= LAMB_STAGES[i].minPoints) {
      return LAMB_STAGES[i]
    }
  }
  return LAMB_STAGES[0]
}

/**
 * 다음 단계까지 필요한 포인트
 */
export const getPointsToNextStage = (
  currentPoints: number
): { needed: number; total: number; nextStage: LambStage } | null => {
  const currentStage = calculateLambStage(currentPoints)
  const currentIndex = LAMB_STAGES.findIndex(s => s.level === currentStage.level)
  
  if (currentIndex === LAMB_STAGES.length - 1) {
    return null // 최고 단계
  }
  
  const nextStage = LAMB_STAGES[currentIndex + 1]
  return {
    needed: nextStage.minPoints - currentPoints,
    total: nextStage.minPoints - currentStage.minPoints,
    nextStage,
  }
}

/**
 * 책 ID로 꽃 타입 결정
 */
export const getFlowerType = (bookId: number): FlowerType => {
  return BOOK_TO_FLOWER[bookId] || 'daisy'
}

/**
 * 읽은 구절을 정원 꽃으로 변환
 */
export const convertVersesToFlowers = (verses: ReadVerse[]): GardenFlower[] => {
  return verses.map((verse) => ({
    id: `flower-${verse.id}-${verse.verse_id}`,
    verseId: verse.verse_id,
    bookId: verse.book_id,
    bookName: verse.book_name_ko,
    chapter: verse.chapter,
    verse: verse.verse,
    text: verse.text,
    flowerType: getFlowerType(verse.book_id),
    bloomDate: verse.read_at,
    position: { x: 0, y: 0 }, // 그리드 레이아웃 사용으로 불필요
    size: 40, // 고정 크기
  }))
}

/**
 * 정원 통계 계산
 */
export const calculateGardenStats = (flowers: GardenFlower[]): GardenStats => {
  const flowersByType: Record<FlowerType, number> = {
    rose: 0,
    lily: 0,
    tulip: 0,
    daisy: 0,
    sunflower: 0,
    orchid: 0,
  }
  
  flowers.forEach(flower => {
    flowersByType[flower.flowerType]++
  })
  
  const sortedByDate = [...flowers].sort(
    (a, b) => new Date(a.bloomDate).getTime() - new Date(b.bloomDate).getTime()
  )
  
  const oldestFlower = sortedByDate[0] || null
  const newestFlower = sortedByDate[sortedByDate.length - 1] || null
  
  const gardenAge = oldestFlower
    ? Math.floor(
        (Date.now() - new Date(oldestFlower.bloomDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0
  
  return {
    totalFlowers: flowers.length,
    flowersByType,
    oldestFlower,
    newestFlower,
    gardenAge,
  }
}

/**
 * 월별 정원 데이터 생성
 */
export const groupFlowersByMonth = (flowers: GardenFlower[]): MonthlyGarden[] => {
  const monthMap = new Map<string, GardenFlower[]>()
  
  flowers.forEach(flower => {
    const date = new Date(flower.bloomDate)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    
    if (!monthMap.has(key)) {
      monthMap.set(key, [])
    }
    monthMap.get(key)!.push(flower)
  })
  
  const monthlyGardens: MonthlyGarden[] = []
  
  monthMap.forEach((monthFlowers, key) => {
    const [year, month] = key.split('-').map(Number)
    monthlyGardens.push({
      year,
      month,
      flowers: monthFlowers,
      stats: calculateGardenStats(monthFlowers),
    })
  })
  
  return monthlyGardens.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
}

/**
 * 꽃 타입별 이름 (한국어)
 */
export const getFlowerTypeName = (type: FlowerType): string => {
  const names: Record<FlowerType, string> = {
    rose: '장미',
    lily: '백합',
    tulip: '튤립',
    daisy: '데이지',
    sunflower: '해바라기',
    orchid: '난초',
  }
  return names[type]
}

/**
 * 꽃 타입별 설명
 */
export const getFlowerTypeDescription = (type: FlowerType): string => {
  const descriptions: Record<FlowerType, string> = {
    rose: '오경을 읽으면 피어나는 장미',
    lily: '시가서를 읽으면 피어나는 백합',
    tulip: '역사서와 예언서를 읽으면 피어나는 튤립',
    daisy: '복음서를 읽으면 피어나는 데이지',
    sunflower: '사도행전과 서신서를 읽으면 피어나는 해바라기',
    orchid: '요한계시록을 읽으면 피어나는 난초',
  }
  return descriptions[type]
}

/**
 * 정원 레벨 계산 (꽃 개수 기반)
 */
export const calculateGardenLevel = (flowerCount: number): {
  level: number
  name: string
  minFlowers: number
} => {
  const levels = [
    { level: 0, name: '씨앗', minFlowers: 0 },
    { level: 1, name: '새싹 정원', minFlowers: 10 },
    { level: 2, name: '작은 화단', minFlowers: 50 },
    { level: 3, name: '아름다운 정원', minFlowers: 100 },
    { level: 4, name: '풍성한 정원', minFlowers: 300 },
    { level: 5, name: '천국의 정원', minFlowers: 500 },
  ]
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (flowerCount >= levels[i].minFlowers) {
      return levels[i]
    }
  }
  
  return levels[0]
}

export { FLOWER_COLORS, FLOWER_EMOJIS }
