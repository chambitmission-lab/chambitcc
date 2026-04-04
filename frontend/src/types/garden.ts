// 디지털 가드닝 시스템 타입 정의

export interface LambStage {
  level: number
  name: string
  description: string
  minPoints: number
  emoji: string
  animation?: string
}

export interface GardenFlower {
  id: string
  verseId: number
  bookId: number
  bookName: string
  chapter: number
  verse: number
  text: string
  flowerType: FlowerType
  bloomDate: string
  position: { x: number; y: number }
  size: number
}

export type FlowerType = 
  | 'rose'      // 창세기, 출애굽기 등 오경
  | 'lily'      // 시편, 잠언 등 시가서
  | 'tulip'     // 이사야, 예레미야 등 예언서
  | 'daisy'     // 복음서
  | 'sunflower' // 사도행전, 서신서
  | 'orchid'    // 요한계시록

export interface GardenStats {
  totalFlowers: number
  flowersByType: Record<FlowerType, number>
  oldestFlower: GardenFlower | null
  newestFlower: GardenFlower | null
  gardenAge: number // 일 단위
}

export interface MonthlyGarden {
  year: number
  month: number
  flowers: GardenFlower[]
  stats: GardenStats
  snapshot?: string // 이미지 URL (향후)
}

// 어린 양 단계 정의
export const LAMB_STAGES: LambStage[] = [
  {
    level: 0,
    name: '갓 태어난 양',
    description: '이제 막 신앙의 여정을 시작했어요',
    minPoints: 0,
    emoji: '🐑',
  },
  {
    level: 1,
    name: '뛰어노는 양',
    description: '기도와 말씀으로 건강하게 자라고 있어요',
    minPoints: 50,
    emoji: '🐏',
  },
  {
    level: 2,
    name: '건강한 양',
    description: '꾸준한 신앙 생활로 튼튼해졌어요',
    minPoints: 150,
    emoji: '🐑✨',
  },
  {
    level: 3,
    name: '튼튼한 양',
    description: '말씀과 기도로 강건해졌어요',
    minPoints: 300,
    emoji: '🐏💪',
  },
  {
    level: 4,
    name: '지혜로운 양',
    description: '깊은 신앙으로 지혜를 얻었어요',
    minPoints: 500,
    emoji: '🐑📖',
  },
  {
    level: 5,
    name: '빛나는 양',
    description: '신앙의 빛으로 주변을 밝혀요',
    minPoints: 1000,
    emoji: '🐏✨💫',
  },
  {
    level: 6,
    name: '천상의 양',
    description: '완전한 신앙으로 하늘의 영광을 반영해요',
    minPoints: 2000,
    emoji: '🐑👑✨',
  },
]

// 책 ID에 따른 꽃 타입 매핑
export const BOOK_TO_FLOWER: Record<number, FlowerType> = {
  // 오경 (1-5): 장미
  1: 'rose', 2: 'rose', 3: 'rose', 4: 'rose', 5: 'rose',
  
  // 역사서 (6-17): 튤립
  6: 'tulip', 7: 'tulip', 8: 'tulip', 9: 'tulip', 10: 'tulip',
  11: 'tulip', 12: 'tulip', 13: 'tulip', 14: 'tulip', 15: 'tulip',
  16: 'tulip', 17: 'tulip',
  
  // 시가서 (18-22): 백합
  18: 'lily', 19: 'lily', 20: 'lily', 21: 'lily', 22: 'lily',
  
  // 예언서 (23-39): 튤립
  23: 'tulip', 24: 'tulip', 25: 'tulip', 26: 'tulip', 27: 'tulip',
  28: 'tulip', 29: 'tulip', 30: 'tulip', 31: 'tulip', 32: 'tulip',
  33: 'tulip', 34: 'tulip', 35: 'tulip', 36: 'tulip', 37: 'tulip',
  38: 'tulip', 39: 'tulip',
  
  // 복음서 (40-43): 데이지
  40: 'daisy', 41: 'daisy', 42: 'daisy', 43: 'daisy',
  
  // 사도행전 (44): 해바라기
  44: 'sunflower',
  
  // 서신서 (45-65): 해바라기
  45: 'sunflower', 46: 'sunflower', 47: 'sunflower', 48: 'sunflower',
  49: 'sunflower', 50: 'sunflower', 51: 'sunflower', 52: 'sunflower',
  53: 'sunflower', 54: 'sunflower', 55: 'sunflower', 56: 'sunflower',
  57: 'sunflower', 58: 'sunflower', 59: 'sunflower', 60: 'sunflower',
  61: 'sunflower', 62: 'sunflower', 63: 'sunflower', 64: 'sunflower',
  65: 'sunflower',
  
  // 요한계시록 (66): 난초
  66: 'orchid',
}

// 꽃 타입별 색상
export const FLOWER_COLORS: Record<FlowerType, string> = {
  rose: '#ef4444',      // 빨강
  lily: '#f9fafb',      // 흰색
  tulip: '#ec4899',     // 분홍
  daisy: '#fbbf24',     // 노랑
  sunflower: '#f59e0b', // 주황
  orchid: '#a855f7',    // 보라
}

// 꽃 타입별 이모지
export const FLOWER_EMOJIS: Record<FlowerType, string> = {
  rose: '🌹',
  lily: '🌸',
  tulip: '🌷',
  daisy: '🌼',
  sunflower: '🌻',
  orchid: '🌺',
}
