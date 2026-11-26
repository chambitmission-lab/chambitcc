/**
 * 책 목록의 "읽기 위치" 규칙 — 지금 읽는 책·다음 책·기본 탭·격려 문구 구간·요약 수치.
 *
 * 격자·목록(BookSelector)과 여정(BookJourneyPath)이 같은 규칙을 따로 들고 있다가
 * 한쪽만 고쳐지면 보기를 바꿀 때 강조되는 책이 달라진다 — 그래서 React 밖 순수 함수로 한곳에 둔다.
 */
import type { BibleBook } from '../../../../types/bible'
import type { ReadingProgressResponse, ResumePosition } from '../../../../api/bibleReading'
import { parseApiDate } from '../../../../utils/dateUtils'
import type { BookInfoMap } from '../readingProgressInfo'

export type Testament = 'OT' | 'NT'

type ResumeMap = Map<number, ResumePosition> | undefined

const isUnfinished = (infoMap: BookInfoMap, book: BibleBook) => (infoMap.get(book.book_number)?.rate ?? 0) < 100

/**
 * 지금 읽는 책 — 넘겨받은 책들 가운데 가장 최근에 펼친 책의 권 번호.
 * 읽은 기록이 하나도 없으면 undefined. 같은 시각이면 목록에서 앞선 책이 이긴다.
 */
export const findCurrentBookNumber = (books: BibleBook[] | undefined, resumeMap: ResumeMap): number | undefined => {
  let bestNumber: number | undefined
  let bestTime = -Infinity
  books?.forEach(b => {
    const pos = resumeMap?.get(b.book_number)
    if (!pos?.read_at) return
    const time = parseApiDate(pos.read_at).getTime()
    if (time > bestTime) {
      bestTime = time
      bestNumber = b.book_number
    }
  })
  return bestNumber
}

interface NextBookOptions {
  /** 지금 읽는 책이 아직 미완독이면 '다음'을 짚지 않는다 — 격자·목록(읽는 중인 책이 곧 갈 곳) */
  skipWhileReading?: boolean
  /** 지금 읽는 책이 이 목록에 없으면 목록 처음부터 찾는다 — 격자·목록(분류 필터로 가려졌을 때) */
  startOverWhenAbsent?: boolean
}

/**
 * 다음 읽을 책 — 지금 읽는 책 바로 뒤에서 아직 완독하지 않은 첫 책 하나.
 * 읽은 기록이 없으면(current undefined) 목록의 첫 미완독 책이 출발점이 된다.
 *
 * 여정 보기는 옵션 없이(항상 다음 정거장 하나를 밝힌다), 격자·목록은 두 옵션을 모두 켜서 쓴다.
 */
export const findNextBookNumber = (
  books: BibleBook[],
  infoMap: BookInfoMap,
  currentBookNumber: number | undefined,
  { skipWhileReading = false, startOverWhenAbsent = false }: NextBookOptions = {},
): number | undefined => {
  const curIdx = currentBookNumber === undefined ? -1 : books.findIndex(b => b.book_number === currentBookNumber)
  if (currentBookNumber !== undefined && curIdx < 0 && !startOverWhenAbsent) return undefined
  if (skipWhileReading && curIdx >= 0 && isUnfinished(infoMap, books[curIdx])) return undefined
  return books.slice(curIdx + 1).find(b => isUnfinished(infoMap, b))?.book_number
}

/**
 * 기본 탭 = 지금 읽고 있는 쪽. 가장 최근에 읽은 책이 속한 쪽을 펼치되,
 * 그쪽을 이미 다 읽었고 반대쪽이 남아 있으면 반대쪽으로 넘겨 준다
 * (구약을 다 읽었으면 신약 — 읽은 기록이 없어도 같은 규칙이 적용된다)
 */
export const pickAutoTestament = (
  currentBookNumber: number | undefined,
  otDone: boolean,
  ntDone: boolean,
): Testament => {
  const base: Testament = currentBookNumber !== undefined && currentBookNumber >= 40 ? 'NT' : 'OT'
  const baseDone = base === 'OT' ? otDone : ntDone
  const otherDone = base === 'OT' ? ntDone : otDone
  if (baseDone && !otherDone) return base === 'OT' ? 'NT' : 'OT'
  return base
}

/** 완독 축하 대상 — 한쪽만 다 읽었을 때 그쪽. 둘 다 읽었거나 둘 다 남았으면 없다 */
export const pickDoneSide = (otDone: boolean, ntDone: boolean): Testament | null =>
  otDone && !ntDone ? 'OT' : ntDone && !otDone ? 'NT' : null

export type CheerKey = 'cheerStart' | 'cheerEarly' | 'cheerSteady' | 'cheerHalf' | 'cheerAlmost' | 'cheerDone'

/** 격려 문구 구간 — 전체 진행률(%)을 문구 키로 */
export const cheerKeyFor = (rate: number): CheerKey => {
  if (rate >= 100) return 'cheerDone'
  if (rate >= 85) return 'cheerAlmost'
  if (rate >= 50) return 'cheerHalf'
  if (rate >= 10) return 'cheerSteady'
  if (rate > 0) return 'cheerEarly'
  return 'cheerStart'
}

/** 문구를 "앞부분 + 마지막 어절"로 나눈다 — 마지막 어절은 아이콘과 묶여 함께 줄바꿈된다 */
export const splitLastWord = (raw: string): { head: string; tail: string } => {
  const text = raw.trim()
  const cut = text.lastIndexOf(' ')
  return cut < 0 ? { head: '', tail: text } : { head: text.slice(0, cut + 1), tail: text.slice(cut + 1) }
}

export interface SummaryStat {
  id: 'all' | 'ot' | 'nt'
  label: string
  rate: number
  read: number
  total: number
  unit: string
  detail: string
}

export interface SummaryLabels {
  whole: string
  oldTestament: string
  newTestament: string
  chapterUnit: string
  verseUnit: string
}

/**
 * 전체/구약/신약 요약 — 장 기준을 주 지표로 쓰고, 장 집계가 없는 구버전 응답에서는 절 기준으로 폴백.
 * 진행률 원본이 없으면 빈 배열.
 */
export const buildSummaryStats = (
  progress: ReadingProgressResponse['data'] | undefined,
  labels: SummaryLabels,
): SummaryStat[] => {
  if (!progress) return []
  const build = (
    id: SummaryStat['id'],
    label: string,
    src: ReadingProgressResponse['data']['overall'],
  ): SummaryStat => {
    const hasChapters = (src.total_chapters ?? 0) > 0
    const read = hasChapters ? (src.read_chapters ?? 0) : src.read_verses
    const total = hasChapters ? (src.total_chapters ?? 0) : src.total_verses
    const rate = hasChapters ? (read / (total || 1)) * 100 : src.progress_rate
    const unit = hasChapters ? labels.chapterUnit : labels.verseUnit
    return {
      id,
      label,
      rate: Math.max(0, Math.min(100, rate)),
      read,
      total,
      unit,
      detail: `${read.toLocaleString()} / ${total.toLocaleString()}${unit}`,
    }
  }
  return [
    build('all', labels.whole, progress.overall),
    build('ot', labels.oldTestament, progress.old_testament),
    build('nt', labels.newTestament, progress.new_testament),
  ]
}
