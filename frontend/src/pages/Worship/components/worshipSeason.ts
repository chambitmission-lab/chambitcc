// /worship 2026-11 "처음 온 성도" 개편 — 계절 옷 · 시각별 하늘 · 달력 파일.
// 시안: /#/dev/worship-redesign?v=a2&s=spring|summer|autumn|winter

import type { NaturalSeason } from '../../../utils/naturalSeason'

/** 시각(자정 기준 분) → 그 시각의 하늘. 평일 카드 사진·점 색과 주일 카드 하늘 띠가 같은 규칙을 쓴다 */
export type Sky = 'dawn' | 'day' | 'dusk' | 'night'
export const skyOf = (startMin: number): Sky => {
  if (startMin < 7 * 60) return 'dawn'
  if (startMin < 17 * 60) return 'day'
  if (startMin < 20 * 60) return 'dusk'
  return 'night'
}

/** 주일 시간 카드 위 하늘 띠 — 이른 새벽 · 밝은 아침 · 깊은 한낮 · 열린 오후 */
export const sundaySkyBand = (startMin: number): string => {
  if (startMin < 8 * 60 + 30) return 'linear-gradient(100deg, #f6c7a6 0%, #e9c9c9 40%, #b8cbe8 100%)'
  if (startMin < 10 * 60 + 30) return 'linear-gradient(100deg, #d6ebfb 0%, #a9d2f5 100%)'
  if (startMin < 12 * 60 + 30) return 'linear-gradient(100deg, #79b4f1 0%, #3f8ae0 100%)'
  return 'linear-gradient(100deg, #9cc4ec 0%, #f3d79c 100%)'
}

/** 평일 시간 앞 작은 점 — 그 시각 하늘색 */
export const SKY_DOT: Record<Sky, string> = {
  dawn: 'linear-gradient(160deg, #2c4a86 0%, #7d7fb8 55%, #f2b49a 100%)',
  day: 'linear-gradient(160deg, #8ec5f4 0%, #cfe6fb 100%)',
  dusk: 'linear-gradient(160deg, #5a6fb0 0%, #c98fa6 60%, #f3c08f 100%)',
  night: 'linear-gradient(160deg, #0f1d44 0%, #24356e 100%)',
}

/** 평일 카드 사진 — 낮만 낮 사진, 새벽·저녁·밤은 불 켜진 밤 사진(새벽·저녁은 CSS 베일로 동틈/노을) */
export const skyPhoto = (season: NaturalSeason, sky: Sky) =>
  `/images/visit/scene-${season}-${sky === 'day' ? 'day' : 'night'}.webp`

export const SKY_KEY = {
  dawn: 'worshipWhenDawn',
  day: 'worshipWhenDay',
  dusk: 'worshipWhenDusk',
  night: 'worshipWhenNight',
} as const

/** 계절별 길 머리말 · 첫 걸음 돌봄 한 줄 (날씨는 정보가 아니라 돌봄) */
export const SEASON_KEYS: Record<NaturalSeason, { name: string; head: string; care: string }> = {
  spring: { name: 'worshipSeasonSpring', head: 'worshipWalkHeadSpring', care: 'worshipWalkCareSpring' },
  summer: { name: 'worshipSeasonSummer', head: 'worshipWalkHeadSummer', care: 'worshipWalkCareSummer' },
  autumn: { name: 'worshipSeasonAutumn', head: 'worshipWalkHeadAutumn', care: 'worshipWalkCareAutumn' },
  winter: { name: 'worshipSeasonWinter', head: 'worshipWalkHeadWinter', care: 'worshipWalkCareWinter' },
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 이번 주일 예배를 휴대폰 달력에 담는 .ics — 서울 시간 고정(TZID) */
export const downloadServiceIcs = (opts: {
  sunday: Date
  startMin: number
  durationMin: number
  title: string
  location: string
  description: string
}) => {
  const { sunday, startMin, durationMin, title, location, description } = opts
  const day = `${sunday.getFullYear()}${pad(sunday.getMonth() + 1)}${pad(sunday.getDate())}`
  const at = (min: number) => `${day}T${pad(Math.floor(min / 60))}${pad(min % 60)}00`
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
  const now = new Date()
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//chambit//worship//KO',
    'BEGIN:VEVENT',
    `UID:worship-${day}-${startMin}@chambitcc`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Asia/Seoul:${at(startMin)}`,
    `DTEND;TZID=Asia/Seoul:${at(startMin + durationMin)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `chambit-worship-${day}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
