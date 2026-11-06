import type { TimelineEvent, TimelineType } from '../../../types/growth'

// 발자취(ActivityTimeline) 하루 묶음의 순수 규칙 — 어떤 기록이 '순간'인지, 그날을 말해 주는
// 한 문장, 조용한 날 접기. AI 없이 규칙으로만 만든다 (말씀 여정 인사이트와 같은 원칙)

/** 내가 쓴 글이 남는 기록 — 카드로 크게 띄운다. 나머지(읽기·함께 기도 묶음·플랜·게임)는 한 줄 */
const MOMENT_TYPES: ReadonlySet<TimelineType> = new Set<TimelineType>([
  'prayer',
  'answered',
  'meditation',
  'thanks',
  'note',
])

export const isMoment = (e: TimelineEvent): boolean => {
  if (MOMENT_TYPES.has(e.type)) return true
  // 기도 시간·나눔 글은 메모/본문이 있을 때만 순간으로 본다
  if ((e.type === 'session' || e.type === 'post') && !!e.snippet) return true
  return false
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/** "HH:MM" → 분. 없으면 null */
const minutesOf = (time: string | null): number | null => {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

/** 문장 조각 — 이어 쓸 때(-고)와 끝맺을 때(-어요) 두 꼴 */
interface Clause {
  link: string
  final: string
}

/** 앞에 올수록 그날을 대표한다 */
const CLAUSE_ORDER: TimelineType[] = [
  'prayer',
  'session',
  'read',
  'intercession',
  'meditation',
  'note',
  'thanks',
  'plan',
  'post',
  'game',
]

const clauseFor = (type: TimelineType, events: TimelineEvent[]): Clause | null => {
  const n = events.length
  switch (type) {
    case 'prayer': {
      if (n > 1) return { link: `기도를 ${n}번 올리고`, final: `기도를 ${n}번 올렸어요` }
      const m = minutesOf(events[0].time)
      if (m !== null && m < 9 * 60)
        return { link: '이른 아침 기도로 하루를 열고', final: '이른 아침 기도로 하루를 열었어요' }
      if (m !== null && m >= 21 * 60)
        return { link: '기도로 하루를 닫고', final: '기도로 하루를 닫았어요' }
      return { link: '기도를 올리고', final: '기도를 올렸어요' }
    }
    case 'session': {
      const min = events.reduce((s, e) => s + num(e.meta?.duration_min), 0)
      return min > 0
        ? { link: `${min}분 동안 기도하고`, final: `${min}분 동안 기도했어요` }
        : { link: '기도 시간을 갖고', final: '기도 시간을 가졌어요' }
    }
    case 'read': {
      const verses = events.reduce((s, e) => s + num(e.meta?.verse_count), 0)
      return verses > 0
        ? { link: `말씀 ${verses}절을 읽고`, final: `말씀 ${verses}절을 읽었어요` }
        : { link: '말씀을 읽고', final: '말씀을 읽었어요' }
    }
    case 'intercession': {
      const c = events.reduce((s, e) => s + num(e.meta?.count), 0) || n
      return { link: `${c}개의 기도에 마음을 보태고`, final: `${c}개의 기도에 마음을 보탰어요` }
    }
    case 'meditation':
      return { link: '묵상을 기록하고', final: '묵상을 기록했어요' }
    case 'note':
      return { link: '묵상 노트를 쓰고', final: '묵상 노트를 썼어요' }
    case 'thanks':
      return n > 1
        ? { link: `감사 ${n}가지를 남기고`, final: `감사 ${n}가지를 남겼어요` }
        : { link: '감사를 남기고', final: '감사를 남겼어요' }
    case 'plan':
      return { link: '읽기 플랜을 이어 가고', final: '읽기 플랜을 이어 갔어요' }
    case 'post':
      return { link: '나눔 글을 남기고', final: '나눔 글을 남겼어요' }
    case 'game':
      return { link: '성경 보드게임을 완주하고', final: '성경 보드게임을 완주했어요' }
    default:
      return null
  }
}

/** 그날을 말해 주는 한 문장 — 대표 활동 두 가지까지 이어 붙인다.
    예) "이른 아침 기도로 하루를 열고 말씀 72절을 읽었어요" */
export const daySentence = (events: TimelineEvent[]): string => {
  const byType = new Map<TimelineType, TimelineEvent[]>()
  events.forEach((e) => {
    const list = byType.get(e.type)
    if (list) list.push(e)
    else byType.set(e.type, [e])
  })
  // 응답 기도가 있는 날은 그 하나로 하루를 말한다 — 다른 일과 이어 붙이면 무게가 흐려진다
  if (byType.has('answered')) return '기도가 응답된 날이에요'
  const clauses = CLAUSE_ORDER.filter((t) => byType.has(t))
    .map((t) => clauseFor(t, byType.get(t) as TimelineEvent[]))
    .filter((c): c is Clause => !!c)
    .slice(0, 2)
  if (clauses.length === 0) return ''
  if (clauses.length === 1) return clauses[0].final
  const [a, b] = clauses
  return `${a.link} ${b.final}`
}

// ── 조용한 날 접기 ─────────────────────────────────────────────

export interface FoldableDay {
  date: string
  events: TimelineEvent[]
  showMonth: boolean
}

export type DaySegment<D extends FoldableDay> =
  | { kind: 'day'; day: D }
  | { kind: 'fold'; key: string; days: D[] }

/** 이만큼 이어진 조용한 날부터 한 줄로 접는다 */
export const FOLD_MIN_DAYS = 3

const isQuietDay = (d: FoldableDay) => d.events.length > 0 && !d.events.some(isMoment)

/** 순간이 없는 날이 FOLD_MIN_DAYS 이상 이어지면 묶는다.
    오늘과 달이 바뀌는 날(월 구분선)은 묶음을 끊는다 */
export const segmentDays = <D extends FoldableDay>(days: D[], today: string): DaySegment<D>[] => {
  const out: DaySegment<D>[] = []
  let run: D[] = []
  const flush = () => {
    if (run.length >= FOLD_MIN_DAYS) out.push({ kind: 'fold', key: run[0].date, days: run })
    else run.forEach((day) => out.push({ kind: 'day', day }))
    run = []
  }
  days.forEach((day) => {
    if (day.showMonth) flush()
    if (day.date !== today && isQuietDay(day)) {
      run.push(day)
    } else {
      flush()
      out.push({ kind: 'day', day })
    }
  })
  flush()
  return out
}

const md = (date: string) => {
  const [, m, d] = date.split('-').map(Number)
  return `${m}월 ${d}일`
}

/** 접힌 묶음 한 줄 — "11월 1일 – 11월 3일 · 말씀만 읽은 날 3일 · 186절" */
export const foldLabel = (days: FoldableDay[]): string => {
  const newest = days[0].date
  const oldest = days[days.length - 1].date
  const range = `${md(oldest)} – ${md(newest)}`
  const all = days.flatMap((d) => d.events)
  if (all.every((e) => e.type === 'read')) {
    const verses = all.reduce((s, e) => s + num(e.meta?.verse_count), 0)
    return `${range} · 말씀만 읽은 날 ${days.length}일${verses > 0 ? ` · ${verses}절` : ''}`
  }
  return `${range} · 조용히 걸은 날 ${days.length}일`
}
