import type { PrayerEmotion } from '../types/prayer'
import { requestData } from './utils/request'

/** year·half·month = 1년·6개월·1개월 전 오늘(±3일), first = 셋 다 없을 때 처음 남긴 기도 */
export type MemoryOffset = 'year' | 'half' | 'month' | 'first'
export type MemoryKind = 'prayer' | 'meditation' | 'thanks' | 'typing'

export interface TodayMemory {
  kind: MemoryKind
  id: number
  offset: MemoryOffset
  /** 그날 정확히 남긴 기록인지 (아니면 앞뒤 3일 안의 기록) */
  exact: boolean
  date: string
  text: string
  // 기도
  title?: string | null
  is_answered?: boolean
  prayer_count?: number
  is_private?: boolean
  // 묵상·필사
  reference?: string | null
  // 필사
  verse_count?: number
  book_number?: number
  chapter?: number
}

export interface AnsweredEcho {
  prayer_id: number
  title: string | null
  text: string
  testimony: string
  created_date: string
  answered_date: string
  days: number
  prayer_count: number
}

export type ChurchMetricKey = 'active_users' | 'chapters' | 'prayers' | 'typing_verses' | 'meditations'

export interface ChurchDay {
  /** 어제 날짜 (KST) */
  date: string
  /** 활동 인원이 너무 적어 숫자를 숨긴 날 */
  hidden: boolean
  metrics: Record<ChurchMetricKey, { value: number; avg: number }> | null
  /** 0~23시 '기도했어요' 수 — 표본이 적으면 null */
  hours: number[] | null
  top_chapters: { book_number: number; chapter: number; book_name: string; readers: number }[]
  /** 책별 읽은 장 수 순위 — people 은 인원이 적으면 null (옛 백엔드는 필드 없음) */
  reading_books?: { book_number: number; book_name: string; chapters: number; people: number | null }[]
  /** 책별 필사 순위 — verses 는 성도×절, chapters 는 서로 다른 장 수 */
  typing_books?: { book_number: number; book_name: string; verses: number; chapters: number; people: number | null }[]
  emotions: { emotion: PrayerEmotion; count: number; rising: boolean }[]
}

export interface TodayChurch {
  date: string
  memories: TodayMemory[]
  answered_echo: AnsweredEcho | null
  church: ChurchDay
}

export const getTodayChurch = (): Promise<TodayChurch> =>
  requestData('/today-church', {
    auth: 'required',
    errorMessage: '오늘의 교회를 불러오지 못했습니다',
  })
