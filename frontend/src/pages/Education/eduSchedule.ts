// 교육과 훈련 — 프로그램 문자열에서 '언제 모이는지'를 읽어내는 순수 함수들.
//
// DB 에는 요일·시각 컬럼이 따로 없고 meeting_time("주일 오전 11:20", "목요일 19:00-20:00")과
// description("· 오전반: 금요일 11:00-12:00")에 사람이 쓴 문장으로만 있다. 여기서 그 문장을
// 읽어 이번 주 시간표·다음 모임 칩을 만든다. 읽히지 않는 문장("주일 예배 후", "매일 한 과")은
// 시간표에 올리지 않을 뿐 지어내지 않는다 — 빈 값 = 미확인 규약과 같은 태도.
// 파싱은 한국어 원문(_ko) 기준 — 영어 화면에서도 요일·시각은 같으므로 표시만 번역한다.
import type { EducationProgram } from '../../types/education'

export interface EduSession {
  key: string
  /** Date#getDay — 0 = 주일 */
  day: number
  h: number
  mi: number
  /** 끝 시각 (없으면 시작 + 70분으로 본다) */
  endMin: number | null
  /** "오전반" 같은 반 이름 */
  ban: string
}

const SESSION_RE = /(주일|[월화수목금토]요일)\s*(?:(오전|오후)\s*)?(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?/g
const DEFAULT_LENGTH_MIN = 70

export function programSessions(p: EducationProgram): EduSession[] {
  const text = `${p.meeting_time_ko ?? ''}\n${p.description_ko ?? ''}`
  const out: EduSession[] = []
  for (const line of text.split('\n')) {
    SESSION_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = SESSION_RE.exec(line))) {
      const day = m[1] === '주일' ? 0 : '일월화수목금토'.indexOf(m[1][0])
      let h = Number(m[3])
      if (m[2] === '오후' && h < 12) h += 12
      const mi = Number(m[4])
      let endMin: number | null = null
      if (m[5]) {
        let eh = Number(m[5])
        if (m[2] === '오후' && eh < 12) eh += 12
        endMin = eh * 60 + Number(m[6])
      }
      const key = `${day}-${h}:${mi}`
      if (out.some((s) => s.key === key)) continue
      out.push({ key, day, h, mi, endMin, ban: (line.match(/(\S+반)\s*:/) ?? [])[1] ?? '' })
    }
  }
  return out
}

const startMin = (s: EduSession) => s.h * 60 + s.mi
const endMin = (s: EduSession) => s.endMin ?? startMin(s) + DEFAULT_LENGTH_MIN

/** 지금 이 순간 진행 중인지 (오늘 요일 + 시작~끝 사이) */
export const isLive = (s: EduSession, now: Date) => {
  const n = now.getHours() * 60 + now.getMinutes()
  return s.day === now.getDay() && n >= startMin(s) && n < endMin(s)
}
export const isOver = (s: EduSession, now: Date) =>
  s.day === now.getDay() && now.getHours() * 60 + now.getMinutes() >= endMin(s)

export interface NextSession extends EduSession {
  /** 오늘부터 며칠 뒤 (0 = 오늘) */
  inDays: number
  live: boolean
}

export function nextSession(p: EducationProgram, now: Date): NextSession | null {
  let best: (NextSession & { score: number }) | null = null
  for (const s of programSessions(p)) {
    let inDays = (s.day - now.getDay() + 7) % 7
    const live = isLive(s, now)
    if (inDays === 0 && !live && isOver(s, now)) inDays = 7
    const score = inDays * 1440 + startMin(s)
    if (!best || score < best.score) best = { ...s, inDays, live, score }
  }
  return best
}

const DAY_KO = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_SHORT_KO = ['주일', '월', '화', '수', '목', '금', '토']
export const DAY_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const formatTime = (h: number, mi: number, ko: boolean) => {
  const hh = h % 12 === 0 ? 12 : h % 12
  const mm = String(mi).padStart(2, '0')
  if (ko) return `${h < 12 ? '오전' : '오후'} ${hh}:${mm}`
  return `${hh}:${mm} ${h < 12 ? 'AM' : 'PM'}`
}

/** 다음 모임 칩 문구 — big: "내일 오전 11:00" / small: "금요일" */
export function whenLabel(n: NextSession | null, ko: boolean): { big: string; small: string; live: boolean } | null {
  if (!n) return null
  const t = formatTime(n.h, n.mi, ko)
  const dayName = ko ? DAY_KO[n.day] : DAY_EN[n.day]
  if (n.live) return { big: ko ? '지금 모이는 중' : 'Happening now', small: ko ? `${t} 시작` : `Started ${t}`, live: true }
  if (n.inDays === 0) return { big: ko ? `오늘 ${t}` : `Today ${t}`, small: dayName, live: false }
  if (n.inDays === 1) return { big: ko ? `내일 ${t}` : `Tomorrow ${t}`, small: dayName, live: false }
  return { big: ko ? `${n.inDays}일 뒤` : `In ${n.inDays} days`, small: `${dayName} ${t}`, live: false }
}

/** "8주 과정", "등록 후 4주" → 8 / 4 */
export const programWeeks = (p: EducationProgram): number | null => {
  const m = `${p.target_ko ?? ''} ${p.meeting_time_ko ?? ''}`.match(/(\d+)\s*주/)
  return m ? Number(m[1]) : null
}

/** "1단계) 생명의 삶" → 1 */
export const programStage = (p: EducationProgram): number | null => {
  const m = p.name_ko.match(/^(\d)단계\)\s*/)
  return m ? Number(m[1]) : null
}
/** 이름 앞 "N단계) " 접두어는 표지 배지로 빼고 떼어 낸다 */
export const stripStage = (name: string) => name.replace(/^\d단계\)\s*/, '')

/** 레거시 설명의 "교사: 강선주 권은숙 …" 줄 → 이름 목록 (아바타 묶음용) */
export const programTeachers = (p: EducationProgram): string[] => {
  const m = (p.description_ko ?? '').match(/교사:\s*([^\n]+)/)
  return m ? m[1].trim().split(/\s+/).filter(Boolean) : []
}
/** "지도장로 … · 부장 … · 부감 …" 줄 */
export const programStaffLine = (p: EducationProgram): string =>
  ((p.description_ko ?? '').match(/지도장로[^\n]*/) ?? [''])[0].trim()

/** 설명에서 교사·지도장로 줄을 뺀 나머지 (그 둘은 따로 그린다). 영어 설명은 그대로 */
export const cleanDescription = (text: string): string =>
  text
    .split('\n')
    .filter((l) => !/^\s*(교사:|지도장로)/.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
