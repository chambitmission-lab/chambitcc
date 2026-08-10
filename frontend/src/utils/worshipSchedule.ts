// 예배 시간표 파싱 — 관리자가 자유 텍스트로 입력한 시간/요일을 계산 가능한 값으로 바꾼다.
// /worship(예배 안내)과 /visit(오시는 길)이 "다음 예배는 언제인가"를 같은 규칙으로 답해야 해서
// 두 화면이 이 모듈을 공유한다. 표시 문구는 각 화면이 알아서 만든다.
import type { WorshipService } from '../types/worship'

export const DAY_CHARS = ['일', '월', '화', '수', '목', '금', '토'] as const

// 관리자 자유 입력 시간("오전 11시 20분", "7:30" 등) → 자정 기준 분.
// 수요기도회처럼 한 항목에 시간이 여러 개("오전 10시 30분, 오후 7시 30분")면 전부 추출한다.
// 해석할 수 없는 형식이면 빈 배열을 반환해 추천/상태 표시만 조용히 생략한다.
export const parseServiceTimes = (time: string): number[] => {
  const out: number[] = []
  const re = /(오전|오후)?\s*(\d{1,2})\s*[시:]\s*(\d{1,2})?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(time)) !== null) {
    let hour = parseInt(m[2], 10)
    const minute = m[3] ? parseInt(m[3], 10) : 0
    if (m[1] === '오후' && hour < 12) hour += 12
    if (m[1] === '오전' && hour === 12) hour = 0
    if (hour > 23 || minute > 59) continue
    out.push(hour * 60 + minute)
  }
  return [...new Set(out)].sort((a, b) => a - b)
}

// 예배가 열리는 요일들(0=일 … 6=토). 주일 예배는 항상 일요일,
// 평일 예배는 subtitle("매주 월~금", "수요일")을 우선 파싱하고 없으면 이름으로 유추한다.
export const serviceDays = (service: WorshipService): number[] | null => {
  if (service.service_type === 'sunday') return [0]

  // "매월"의 월, "요일"의 일이 요일 글자로 오인되지 않게 먼저 제거
  const text = (service.subtitle ?? '').replace(/매월/g, '').replace(/요일/g, '')
  if (text.includes('매일')) return [0, 1, 2, 3, 4, 5, 6]

  const days = new Set<number>()
  const range = text.match(/([일월화수목금토])\s*[~-]\s*([일월화수목금토])/)
  if (range) {
    const from = DAY_CHARS.indexOf(range[1] as typeof DAY_CHARS[number])
    const to = DAY_CHARS.indexOf(range[2] as typeof DAY_CHARS[number])
    for (let d = from; ; d = (d + 1) % 7) {
      days.add(d)
      if (d === to) break
    }
  } else {
    for (const ch of text) {
      const idx = DAY_CHARS.indexOf(ch as typeof DAY_CHARS[number])
      if (idx >= 0) days.add(idx)
    }
  }
  if (days.size > 0) return [...days]

  const name = service.name
  if (name.includes('새벽')) return [1, 2, 3, 4, 5]
  if (name.includes('주일') || name.includes('일요')) return [0]
  if (name.includes('월요')) return [1]
  if (name.includes('화요')) return [2]
  if (name.includes('수요')) return [3]
  if (name.includes('목요')) return [4]
  if (name.includes('금요')) return [5]
  if (name.includes('토요')) return [6]
  return null
}

export interface Occurrence {
  minutes: number // 지금부터 시작까지 남은 분
  dayOffset: number // 0=오늘, 1=내일 …
  startMin: number // 시작 시각 (자정 기준 분)
}

// 지금 이후 가장 가까운 이 예배의 회차
export const nextOccurrence = (
  service: WorshipService,
  seoulNow: Date,
): Occurrence | null => {
  const days = serviceDays(service)
  const times = parseServiceTimes(service.time)
  if (!days || times.length === 0) return null
  const nowMin = seoulNow.getHours() * 60 + seoulNow.getMinutes()
  const today = seoulNow.getDay()
  for (let offset = 0; offset <= 7; offset++) {
    if (!days.includes((today + offset) % 7)) continue
    for (const t of times) {
      const minutes = offset * 1440 + t - nowMin
      if (minutes >= 0) return { minutes, dayOffset: offset, startMin: t }
    }
  }
  return null
}

/** 여러 예배 중 지금 기준 가장 가까운 회차 하나 */
export const soonestService = (
  services: WorshipService[],
  seoulNow: Date,
): { service: WorshipService; occ: Occurrence } | null => {
  const candidates = services
    .filter((s) => s.is_active)
    .map((service) => ({ service, occ: nextOccurrence(service, seoulNow) }))
    .filter((c): c is { service: WorshipService; occ: Occurrence } => c.occ !== null)
    .sort((a, b) => a.occ.minutes - b.occ.minutes)
  return candidates[0] ?? null
}
