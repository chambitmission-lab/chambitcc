// 챗봇 관리(참비 관제실) 공용 계산 — 화면과 떨어진 순수 함수만 둔다.
import type { ChatbotIntent, ChatbotStats, ChatbotUnanswered } from '../../../types/chatbot'

export const compact = (s: string) => s.replace(/\s+/g, '')

export const fmtMD = (s: string) => {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`
}

/** weak 행의 answer 는 '[사유] 참비가 한 답' 꼴 — 둘로 나눈다 */
export const splitWeakAnswer = (answer?: string | null) => {
  if (!answer) return { reason: null as string | null, text: null as string | null }
  const m = answer.match(/^\[([^\]]+)\]\s*([\s\S]*)$/)
  return m ? { reason: m[1], text: m[2] || null } : { reason: null, text: answer }
}

/**
 * 키워드 사전 매칭 흉내 — backend services/chatbot/admin._try_custom_intent 와 같은 규칙.
 * 띄어쓰기 무시, 점수 = 일치한 키워드 길이 합, 동점이면 답하지 않음(ambiguous).
 * 내장 인텐트(예배·말씀 등)가 먼저 잡는 질문은 여기서 알 수 없다.
 */
export const matchIntent = (intents: ChatbotIntent[], question: string) => {
  const msg = compact(question)
  if (!msg) return null
  let best: ChatbotIntent | null = null
  let bestScore = 0
  let ambiguous = false
  let hitKeys: string[] = []
  for (const it of intents) {
    if (!it.is_active) continue
    const hits = it.keywords.filter((k) => {
      const c = compact(k)
      return c.length > 0 && msg.includes(c)
    })
    const score = hits.reduce((s, k) => s + compact(k).length, 0)
    if (score > bestScore) {
      best = it
      bestScore = score
      ambiguous = false
      hitKeys = hits
    } else if (score === bestScore && score > 0) {
      ambiguous = true
    }
  }
  if (!best) return { kind: 'none' as const }
  if (ambiguous) return { kind: 'tie' as const }
  return { kind: 'hit' as const, intent: best, keys: hitKeys }
}

/** 키워드가 다른 답(인텐트)과 부딪히는지 — 서로 포함 관계면 같은 질문에 함께 걸린다 */
export const keywordConflict = (intents: ChatbotIntent[], keyword: string, exceptId?: number | null) => {
  const k = compact(keyword)
  if (k.length < 2) return null
  return (
    intents.find(
      (it) =>
        it.id !== exceptId &&
        it.keywords.some((x) => {
          const c = compact(x)
          return c.length > 0 && (c.includes(k) || k.includes(c))
        }),
    ) ?? null
  )
}

// 아무 질문에나 들어가 엉뚱한 답을 부르는 말 — 키워드 후보에서 빼고, 직접 넣으면 경고한다
export const VAGUE_WORDS = ['뭐야', '알려줘', '언제', '어디', '어떻게', '이름', '성함', '시간', '교회', '참빛', '참빛교회', '궁금']

const JOSA = /(은|는|이|가|을|를|에|에서|으로|로|와|과|도|만|의|요|해요|하나요|인가요|있나요|되나요|돼요|나요|까요|할까|하고|싶어요|싶은데|해줘|줘|야|해)$/

/** 질문 문장에서 키워드 후보 뽑기 — 조사·어미를 떼고 2글자 이상, 막연한 말은 뺀다 */
export const suggestKeywords = (question: string) => {
  const out: string[] = []
  question
    .replace(/[?!.~,…"“”'‘’]/g, ' ')
    .split(/\s+/)
    .forEach((w) => {
      let s = w
      for (let i = 0; i < 2; i++) s = s.replace(JOSA, '')
      if (s.length >= 2 && !VAGUE_WORDS.includes(s) && !out.includes(s)) out.push(s)
    })
  return out.slice(0, 5)
}

/** 최근 7일, 날마다 새로 들어온 질문(처음 물은 날 기준) — 상태별로 */
export const lastSevenDays = (items: ChatbotUnanswered[]) => {
  const days: { key: string; label: string; open: number; weak: number; resolved: number }[] = []
  const now = new Date()
  const WD = ['일', '월', '화', '수', '목', '금', '토']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    days.push({ key: d.toDateString(), label: i === 0 ? '오늘' : WD[d.getDay()], open: 0, weak: 0, resolved: 0 })
  }
  for (const u of items) {
    const d = new Date(u.created_at)
    if (isNaN(d.getTime())) continue
    const row = days.find((x) => x.key === d.toDateString())
    if (row) row[u.status] += 1
  }
  return days
}

/**
 * 하루 집계 → 최근 7일 요약. 답한 비율 = (답함 + 애매하게라도 답함) / 전체.
 * 그 전 7일과의 차이(%p)는 그 기간이 통째로 집계 시작(since) 뒤이고 질문이 있을 때만 — 반쪽 비교는 하지 않는다.
 */
export const weekSummary = (stats: ChatbotStats) => {
  const sum = (ds: ChatbotStats['days']) =>
    ds.reduce(
      (a, d) => ({ answered: a.answered + d.answered + d.weak, total: a.total + d.answered + d.weak + d.missed }),
      { answered: 0, total: 0 },
    )
  const cur = sum(stats.days.slice(-7))
  const prevDays = stats.days.slice(-14, -7)
  const prev = sum(prevDays)
  const rate = cur.total ? Math.round((cur.answered / cur.total) * 100) : 0
  const prevComplete = !!stats.since && prevDays.length === 7 && stats.since <= prevDays[0].date
  const diff = prevComplete && prev.total ? rate - Math.round((prev.answered / prev.total) * 100) : null
  return { total: cur.total, answered: cur.answered, rate, diff }
}

/** 최근 30일 커스텀 인텐트별 답한 횟수 — 인텐트 id → 횟수 */
export const intentHitMap = (stats: ChatbotStats | null) => {
  const m = new Map<number, number>()
  stats?.intent_hits.forEach((h) => m.set(Number(h.key), h.count))
  return m
}
