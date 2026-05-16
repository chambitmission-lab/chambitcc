// 시간대별 분위기 팔레트 — 진입 의식/기도 화면 전반의 톤을 결정한다.
// 새벽(차가운 남색), 아침(부드러운 햇살), 낮(밝은 햇살), 저녁(노을 주황), 밤(보라/푸른 보라)

export type TimeOfDay = 'dawn' | 'morning' | 'day' | 'dusk' | 'night'

export interface MoodPalette {
  id: TimeOfDay
  // tailwind arbitrary value 형태로 그대로 className에 끼워 쓸 수 있도록 풀 클래스 문자열
  bgBase: string          // 페이지 베이스 색
  glowA: string           // 큰 글로우 1 (좌상)
  glowB: string           // 큰 글로우 2 (우하)
  glowC: string           // 작은 글로우 (좌)
  glowD: string           // 작은 글로우 (우하단)
  accentText: string      // 강조 텍스트 색
  ringFrom: string        // 타이머 그라데이션 시작 (svg stop)
  ringTo: string          // 타이머 그라데이션 끝
  buttonGradient: string  // 메인 버튼 그라데이션
}

const PALETTES: Record<TimeOfDay, MoodPalette> = {
  dawn: {
    id: 'dawn',
    bgBase: 'bg-[#0a0f1f]',
    glowA: 'bg-indigo-700/30',
    glowB: 'bg-sky-600/15',
    glowC: 'bg-indigo-500/20',
    glowD: 'bg-sky-500/10',
    accentText: 'text-sky-300/90',
    ringFrom: '#6366f1',
    ringTo: '#38bdf8',
    buttonGradient: 'from-indigo-500 to-sky-500',
  },
  morning: {
    id: 'morning',
    bgBase: 'bg-[#1a1410]',
    glowA: 'bg-amber-500/25',
    glowB: 'bg-orange-400/15',
    glowC: 'bg-yellow-500/15',
    glowD: 'bg-orange-300/10',
    accentText: 'text-amber-200/90',
    ringFrom: '#f59e0b',
    ringTo: '#fcd34d',
    buttonGradient: 'from-amber-500 to-orange-400',
  },
  day: {
    id: 'day',
    bgBase: 'bg-[#0f1417]',
    glowA: 'bg-sky-500/25',
    glowB: 'bg-teal-400/15',
    glowC: 'bg-cyan-500/20',
    glowD: 'bg-teal-500/10',
    accentText: 'text-cyan-200/90',
    ringFrom: '#06b6d4',
    ringTo: '#5eead4',
    buttonGradient: 'from-cyan-500 to-teal-400',
  },
  dusk: {
    id: 'dusk',
    bgBase: 'bg-[#1a0f14]',
    glowA: 'bg-orange-600/30',
    glowB: 'bg-rose-500/15',
    glowC: 'bg-amber-500/20',
    glowD: 'bg-rose-400/10',
    accentText: 'text-orange-200/90',
    ringFrom: '#f97316',
    ringTo: '#f43f5e',
    buttonGradient: 'from-orange-500 to-rose-500',
  },
  night: {
    id: 'night',
    // 기존 보라/핑크 톤 유지 — 다른 시간대는 이로부터 파생
    bgBase: 'bg-[#0f0f13]',
    glowA: 'bg-purple-700/25',
    glowB: 'bg-pink-600/15',
    glowC: 'bg-purple-500/20',
    glowD: 'bg-pink-500/10',
    accentText: 'text-pink-300/90',
    ringFrom: '#a855f7',
    ringTo: '#ec4899',
    buttonGradient: 'from-purple-500 to-pink-500',
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
