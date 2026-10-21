// 설교 준비 도우미 — 설교 분포 · 본문 중복 확인
import type { WeeklyReport } from './report'
import { pastorGet } from './_http'

export interface SermonRef {
  id: number
  title: string
  date: string
  bible_verse: string | null
  pastor: string
}

export interface EngagedVerse {
  verse_id: number
  book_number: number
  book_name: string
  chapter: number
  verse: number
  text: string
  count: number
  users: number
}

export interface SermonPrep {
  years: 0 | 1 | 3
  total_sermons: number
  in_period: number
  unparsed: number
  testament: { ot: number; nt: number }
  books: Array<{
    book_number: number
    name: string
    testament: 'OT' | 'NT'
    count: number
    last_date: string | null
    sermons: SermonRef[]
  }>
  stale: Array<{ book_number: number; name: string; last_date: string | null }>
  recent: Array<SermonRef & { views: number; parsed: boolean }>
  heart: WeeklyReport['emotions']
  engagement: {
    days: number
    favorites: EngagedVerse[]
    underlines: EngagedVerse[]
    words: string[]
  }
}

export interface PassageCheck {
  query: string
  parsed: string[]
  matches: SermonRef[]
}

export const fetchSermonPrep = (years: number): Promise<SermonPrep> =>
  pastorGet(`/pastor/sermon-prep?years=${years}`, '설교 준비 자료를 불러오는데 실패했습니다')

export const checkPassage = (ref: string): Promise<PassageCheck> =>
  pastorGet(`/pastor/sermon-prep/check?ref=${encodeURIComponent(ref)}`, '본문 확인에 실패했습니다')
