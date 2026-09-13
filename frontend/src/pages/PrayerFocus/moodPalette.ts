// 시간대별 분위기 팔레트 — 집중 기도 흐름의 배경 공기만 결정한다.
// 새벽(차가운 남색), 아침(부드러운 햇살), 낮(밝은 햇살), 저녁(노을 주황), 밤(보라)
// 버튼·선택·타이머 아크 같은 강조 톤은 시간대와 무관하게 촛불빛을 따른다 — candleTone.ts

export type TimeOfDay = 'dawn' | 'morning' | 'day' | 'dusk' | 'night'

export interface MoodPalette {
  id: TimeOfDay
  // tailwind arbitrary value 형태로 그대로 className에 끼워 쓸 수 있도록 풀 클래스 문자열
  bgBase: string          // 페이지 베이스 색
  glowA: string           // 큰 배경 글로우
  ringFrom: string        // 촛불 외곽 할로 틴트 (6자리 hex)
  greetingKey: string     // 설정 화면 시간대별 인사말 (prayer i18n 키)
}

const PALETTES: Record<TimeOfDay, MoodPalette> = {
  dawn: {
    id: 'dawn',
    bgBase: 'bg-[#0a0f1f]',
    glowA: 'bg-indigo-700/30',
    ringFrom: '#6366f1',
    greetingKey: 'focusGreetingDawn',
  },
  morning: {
    id: 'morning',
    bgBase: 'bg-[#1a1410]',
    glowA: 'bg-amber-500/25',
    ringFrom: '#f59e0b',
    greetingKey: 'focusGreetingMorning',
  },
  day: {
    id: 'day',
    bgBase: 'bg-[#0f1417]',
    glowA: 'bg-sky-500/25',
    ringFrom: '#06b6d4',
    greetingKey: 'focusGreetingDay',
  },
  dusk: {
    id: 'dusk',
    bgBase: 'bg-[#1a0f14]',
    glowA: 'bg-orange-600/30',
    ringFrom: '#f97316',
    greetingKey: 'focusGreetingDusk',
  },
  night: {
    id: 'night',
    bgBase: 'bg-[#0f0f13]',
    glowA: 'bg-purple-700/25',
    ringFrom: '#a855f7',
    greetingKey: 'focusGreetingNight',
  },
}

export const getCurrentMood = (date: Date = new Date()): MoodPalette => {
  const h = date.getHours()
  if (h >= 4 && h < 7) return PALETTES.dawn
  if (h >= 7 && h < 11) return PALETTES.morning
  if (h >= 11 && h < 17) return PALETTES.day
  if (h >= 17 && h < 20) return PALETTES.dusk
  return PALETTES.night
}

export const MOOD_PALETTES = PALETTES
