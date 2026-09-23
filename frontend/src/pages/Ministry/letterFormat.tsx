// 목양칼럼(편지) 화면이 공유하는 서체·날짜·본문 파생값 유틸.
// 컴포넌트에서 분리해 두어 목록·읽기·레일이 같은 규칙으로 표기한다.

import type { Column } from '../../types/column'
import { columnPlainText } from './blockFormat'
import { ensureFontFamily } from '../../utils/deferredFonts'

// 손글씨 서체는 이 화면이 쓸 때만 받는다 (src/utils/deferredFonts.ts)
ensureFontFamily('nanumPen')

// 편지·에세이 톤의 서체 — 성경 읽기 설정과 동일한 스택(이미 index.html에서 로드됨)
// Noto Serif KR은 400/600만 로드되어 있으므로 굵기는 font-semibold(600)까지만 사용
export const SERIF = "'Noto Serif KR', 'Nanum Myeongjo', 'Apple SD Gothic Neo', serif"
export const PEN = "'Nanum Pen Script', 'Pretendard Variable', cursive"

// 정규식 메타문자 이스케이프
const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** 검색 키워드를 텍스트에서 하이라이트 (목록 카드용) */
export const highlightKeyword = (text: string, keyword: string) => {
  const trimmed = keyword.trim()
  if (!trimmed) return text
  const lowerKey = trimmed.toLowerCase()
  const regex = new RegExp(`(${escapeRegex(trimmed)})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    part.toLowerCase() === lowerKey ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/70 text-inherit rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

const parseDate = (dateStr: string): Date | null => {
  const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return null
  return new Date(+m[1], +m[2] - 1, +m[3])
}

/** "2026-07-26" → "2026년 7월 26일 주일" (교회 맥락이므로 일요일은 '주일'로) */
export const formatLetterDate = (dateStr: string, language: string): string => {
  const d = parseDate(dateStr)
  if (!d) return dateStr
  if (language === 'ko') {
    const days = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}`
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** 한국어 평균 묵독 속도(분당 약 500자) 기준 읽기 시간 */
/** 읽기 시간 — 평문 글자 수 기준(500자/분) */
export const minutesForPlainLength = (length: number): number => Math.max(1, Math.round(length / 500))

export const readingMinutes = (content: string): number => minutesForPlainLength(columnPlainText(content).length)

/** 읽기 시간 라벨 — 목록은 짧게(분), 피처드·본문은 "min read" */
export const readingLabel = (content: string, language: string, long = false): string => {
  const min = readingMinutes(content)
  if (language === 'ko') return `${min}분`
  return long ? `${min} min read` : `${min} min`
}

/** 최신 글이 7일 이내면 "이번 주 편지" 배지 */
export const isThisWeek = (dateStr: string): boolean => {
  const d = parseDate(dateStr)
  if (!d) return false
  const diff = Date.now() - d.getTime()
  return diff >= 0 && diff < 1000 * 60 * 60 * 24 * 7
}

/** 본문의 첫 하이라이트 문장 — 피처드 카드에서 인용구로 노출 */
export const firstHighlight = (content: string): string | null => {
  const m = content.match(/\[\[(.*?)\]\]/)
  // [[문구|yellow|wavy]] 처럼 옵션이 붙어 있으면 문구만
  const text = m?.[1]?.split('|')[0]?.trim()
  return text ? stripOuterQuotes(text) || null : null
}

/* 쓰는 쪽(ColumnFeed·MinistryRail)이 문구를 “…” 로 감싸 보여 준다. 형광펜 친 문장이
   그 자체로 따옴표 인용문이면 ““…”” 로 겹치므로 바깥 한 겹만 벗긴다.
   문장 안쪽의 온전한 인용(예수님은 "나를 따르라")은 짝이 맞으므로 건드리지 않는다. */
const QUOTE_CHARS = '"“”„‟‘’「」『』'
const isQuote = (ch: string | undefined) => !!ch && QUOTE_CHARS.includes(ch)
const stripOuterQuotes = (text: string): string => {
  const head = isQuote(text[0])
  const tail = isQuote(text[text.length - 1])
  if (!head && !tail) return text
  const innerText = text.slice(head ? 1 : 0, tail ? -1 : undefined)
  // 안쪽에 따옴표가 또 있으면 양 끝이 한 쌍이라고 단정할 수 없다
  // (“A” 그리고 “B” 를 벗기면 A” 그리고 “B 가 된다) → 그대로 둔다
  if ([...innerText].some(isQuote)) return text
  // 양 끝 한 쌍이거나, 인용문 일부만 칠해 한쪽 따옴표만 딸려 온 경우
  return innerText.trim()
}

/** "2026년 7월" 단위 아카이브 그룹 라벨 */
export const formatMonthLabel = (dateStr: string, language: string): string => {
  const d = parseDate(dateStr)
  if (!d) return dateStr
  return language === 'ko'
    ? `${d.getFullYear()}년 ${d.getMonth() + 1}월`
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

export interface MonthGroup {
  label: string
  items: Column[]
}

/** 지난 편지 월별 그룹 (목록은 최신순이므로 순서 유지하며 묶기만) */
export const groupByMonth = (columns: Column[], language: string): MonthGroup[] => {
  const groups: MonthGroup[] = []
  for (const col of columns) {
    const label = formatMonthLabel(col.date, language)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(col)
    else groups.push({ label, items: [col] })
  }
  return groups
}

/** 월 카드 앵커 id — 본문 카드와 우측 레일 링크가 같은 규칙을 써야 한다 */
export const monthAnchorId = (index: number) => `ministry-month-${index}`

/** 공유용 편지 전문 — 카톡 전달을 염두에 두고 텍스트로 */
export const buildShareText = (column: Column, language: string): string => {
  const body = columnPlainText(column.content)
  const signature = language === 'ko' ? `${column.author} 드림` : `— ${column.author}`
  return `${column.title}\n${formatLetterDate(column.date, language)}\n\n${body}\n\n${signature}`
}

// ── 본문 글자 크기 3단계 — 어르신 성도가 많은 교회 특성상 필수 ───────────
export const FONT_STEPS = [15.5, 16.5, 18.5]
const FONT_STEP_KEY = 'ministry_font_step'

export const loadFontStep = (): number => {
  try {
    const n = Number(localStorage.getItem(FONT_STEP_KEY))
    return Number.isInteger(n) && n >= 0 && n < FONT_STEPS.length ? n : 1
  } catch {
    return 1
  }
}

export const saveFontStep = (step: number) => {
  try {
    localStorage.setItem(FONT_STEP_KEY, String(step))
  } catch {
    /* 무시 */
  }
}
