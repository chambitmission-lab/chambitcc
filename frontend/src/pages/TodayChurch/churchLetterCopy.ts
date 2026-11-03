// 어제 우리 교회 — 참비가 쓰는 손편지 문장과 '하루의 언덕길' 기도 순간. AI 없이 집계 숫자만으로 만든다.
// 화면(ChurchLetter.tsx)과 테스트가 함께 쓰는 순수 함수만 둔다.
import type { ChurchDay } from '../../api/todayChurch'
import type { PrayerEmotion } from '../../types/prayer'

/** 편지 한 줄 = 조각들. hl 은 형광펜 */
export type LetterPiece = { text: string; hl?: boolean }
export type LetterLine = LetterPiece[]

const WEEKDAY = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

export const weekdayOf = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return WEEKDAY[new Date(y, m - 1, d).getDay()]
}

/** 마지막 글자 받침 여부 — 한글이 아니면 받침 없음으로 본다 */
const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}
/** '창세기였어요' / '고린도전서였어요' / '욥기였어요' / '시편이었어요' */
const wasCopula = (word: string) => `${word}${hasBatchim(word) ? '이었어요' : '였어요'}`

const KO_COUNT = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열']
/** 1~10은 '두 분'처럼 우리말, 그 위는 숫자 */
const people = (n: number) => (n >= 1 && n <= 10 ? `${KO_COUNT[n]} 분` : `${n.toLocaleString()}분`)
const times = (n: number) => (n >= 1 && n <= 10 ? `${KO_COUNT[n]} 번` : `${n.toLocaleString()}번`)

export const hourLabel = (h: number) => {
  if (h < 5) return `새벽 ${h === 0 ? 12 : h}시`
  if (h < 12) return `아침 ${h}시`
  if (h === 12) return '낮 12시'
  if (h < 18) return `오후 ${h - 12}시`
  if (h < 21) return `저녁 ${h - 12}시`
  return `밤 ${h - 12}시`
}

/** 시간표(모바일)에 쓰는 때 표현 */
const hourMood = (h: number) => {
  if (h < 5) return '모두 잠든 새벽에'
  if (h < 9) return '해 뜰 무렵'
  if (h < 12) return '오전 사이'
  if (h < 14) return '점심 사이'
  if (h < 18) return '오후에'
  if (h < 21) return '저녁 무렵'
  return '하루를 닫으며'
}

export interface PrayerMoment {
  hour: number
  count: number
  /** 언덕길에 글씨를 붙일 큰 순간인지 (최대 3개, 서로 3시간 이상 떨어짐) */
  labeled: boolean
  label: string
  mood: string
}

/** 기도가 있었던 시간만. 글씨는 많은 순으로 3곳까지, 서로 가까우면 하나만 */
export const prayerMoments = (hours: number[] | null): PrayerMoment[] => {
  if (!hours) return []
  const lit = hours.map((count, hour) => ({ hour, count })).filter((x) => x.count > 0)
  const picked: number[] = []
  for (const x of [...lit].sort((a, b) => b.count - a.count || a.hour - b.hour)) {
    if (picked.length >= 3) break
    if (picked.every((h) => Math.abs(h - x.hour) >= 3)) picked.push(x.hour)
  }
  return lit.map((x) => ({
    ...x,
    labeled: picked.includes(x.hour),
    label: hourLabel(x.hour),
    mood: hourMood(x.hour),
  }))
}

const HEAVY: PrayerEmotion[] = ['tired', 'anxious', 'sad', 'lonely', 'angry', 'confused']
export const EMOTION_WORD: Record<PrayerEmotion, string> = {
  tired: '지친',
  anxious: '불안한',
  sad: '슬픈',
  lonely: '외로운',
  angry: '화난',
  confused: '혼란한',
  hopeful: '소망',
  grateful: '감사',
}
export const EMOTION_NOTE: Record<PrayerEmotion, string> = {
  tired: '지친 마음',
  anxious: '불안한 마음',
  sad: '슬픈 마음',
  lonely: '외로운 마음',
  angry: '속상한 마음',
  confused: '혼란한 마음',
  hopeful: '소망',
  grateful: '감사',
}

/** 숫자가 보이는 날의 편지. hidden 이거나 metrics 가 없으면 쉬어 가는 편지 */
export const buildLetter = (church: ChurchDay): LetterLine[] => {
  const m = church.metrics
  if (church.hidden || !m) {
    return [
      [{ text: '어제는 함께한 성도가 적어서 숫자를 쉬어 가요.' }],
      [{ text: '누가 했는지 짐작되지 않도록' }],
      [{ text: '적은 인원의 기록은 편지에 적지 않아요.' }],
      ...emotionLines(church),
    ]
  }
  const lines: LetterLine[] = []
  const day = weekdayOf(church.date)
  const users = m.active_users
  const chapters = m.chapters
  if (users.value > users.avg) lines.push([{ text: `어제는 평소보다 함께한 분이 많은 ${day}이었어요.` }])
  else if (chapters.value < chapters.avg * 0.6) lines.push([{ text: `어제는 조금 조용한 ${day}이었어요.` }])
  else lines.push([{ text: `어제도 말씀과 기도가 이어진 ${day}이었어요.` }])

  if (chapters.value > 0) {
    lines.push([
      { text: users.value > users.avg || chapters.value >= chapters.avg * 0.6 ? '' : '그래도 ' },
      { text: people(users.value), hl: true },
      { text: `이 말씀 ${chapters.value.toLocaleString()}장을 펼쳤어요.` },
    ].filter((p) => p.text))
    const top = church.reading_books?.[0]
    if (top && top.chapters * 2 >= chapters.value && top.chapters < chapters.value) {
      lines.push([{ text: `그중 ${top.chapters}장은 ${wasCopula(top.book_name)}.` }])
    } else if (top && top.chapters === chapters.value) {
      lines.push([{ text: `모두 ${wasCopula(top.book_name)}.` }])
    }
  } else {
    lines.push([{ text: people(users.value), hl: true }, { text: '이 기도와 묵상으로 하루를 보냈어요.' }])
  }

  const prayers = m.prayers.value
  if (prayers > 0) {
    // 가장 많았던 두 때를 시간 순으로
    const big = prayerMoments(church.hours)
      .filter((x) => x.labeled)
      .sort((a, b) => b.count - a.count || a.hour - b.hour)
      .slice(0, 2)
      .sort((a, b) => a.hour - b.hour)
    if (big.length === 2) lines.push([{ text: `${big[0].label}에, 그리고 ${big[1].label}에` }])
    else if (big.length === 1) lines.push([{ text: `${big[0].label} 무렵` }])
    lines.push([{ text: '서로를 위한 기도가 ' }, { text: times(prayers), hl: true }, { text: ' 올라갔어요.' }])
  }
  if (m.typing_verses.value > 0) lines.push([{ text: `말씀 ${m.typing_verses.value.toLocaleString()}절을 손으로 따라 쓴 분도 있었어요.` }])
  if (m.meditations.value > 0) lines.push([{ text: `묵상 노트도 ${m.meditations.value.toLocaleString()}편 남겨졌어요.` }])
  lines.push(...emotionLines(church))
  return lines
}

/** 무거운 마음이 있으면 함께 기도하자는 말로 맺는다 — 감사·소망만이면 감사로 맺는다 */
const emotionLines = (church: ChurchDay): LetterLine[] => {
  const heavy = church.emotions.find((e) => HEAVY.includes(e.emotion))
  if (heavy) {
    return [
      [{ text: `이번 주엔 ${EMOTION_WORD[heavy.emotion]} 마음을 올린 분들이 있어요.` }],
      [{ text: '오늘은 우리가 그분들 몫까지 기도해요.' }],
    ]
  }
  const first = church.emotions[0]
  if (!first) return []
  const w = EMOTION_WORD[first.emotion]
  return [[{ text: `이번 주 기도엔 ${w}${hasBatchim(w) ? '이' : '가'} 가장 많이 담겼어요.` }]]
}

/** 필름 카메라 날짜 각인 — '26 11 02 */
export const filmDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-')
  return `'${y.slice(2)} ${m} ${d}`
}
