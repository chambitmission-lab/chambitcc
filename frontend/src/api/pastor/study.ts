// 설교 본문 작업대 — 본문 자료 · 관주
import type { SermonNote } from './notes'
import type { SermonRef } from './sermonPrep'
import { pastorDelete, pastorGet, pastorSend } from './_http'

export interface StudyVerse {
  id: number
  chapter: number
  verse: number
  /** 개역 병합 구간의 첫 절 '18-19' */
  verse_label?: string | null
  text: string
  underline_users: number
  favorite_users: number
  cross_ref_count: number
}

export interface CrossRef {
  id: number
  chapter: number
  verse: number
  label: string
  target: { book_number: number; chapter: number; verse: number; verse_end: number | null }
  text: string | null
  note: string | null
  author: string | null
  mine: boolean
}

export interface StudyCommentary {
  id: number
  chapter: number
  verse_start: number
  verse_end: number
  scope: string
  title: string | null
  category: string | null
  excerpt: string
}

export interface StudyOutline {
  id: number
  title: string
  passage: string | null
  preach_on: string | null
  status: 'draft' | 'done'
  updated_at: string | null
}

export interface SermonStudy {
  query: string
  found: boolean
  label?: string
  book_number?: number
  book_name?: string
  clipped?: boolean
  verses?: StudyVerse[]
  keywords?: { word: string; count: number }[]
  book_intro?: {
    one_liner: string
    theme: string | null
    author_period: string | null
    key_chapters: string | null
    overview: string
    christ_connection: string | null
  } | null
  commentaries?: StudyCommentary[]
  cross_refs?: CrossRef[]
  /** 서버는 더 싣지 않는다(화면이 /notes/related 로 따로 받음) — dev 미리보기가 표본을 넣을 때만 */
  notes?: (SermonNote & { reasons?: string[] })[]
  topics?: string[]
  past_sermons?: SermonRef[]
  outlines?: StudyOutline[]
}

export const fetchSermonStudy = (ref: string): Promise<SermonStudy> =>
  pastorGet(`/pastor/sermon-study?ref=${encodeURIComponent(ref)}`, '본문 자료를 불러오지 못했습니다')

export const addCrossRef = (data: {
  book_number: number
  chapter: number
  verse: number
  target: string
  note?: string | null
}): Promise<CrossRef> => pastorSend('/pastor/cross-refs', 'POST', data, '관주를 잇지 못했습니다')

export const deleteCrossRef = (id: number): Promise<void> =>
  pastorDelete(`/pastor/cross-refs/${id}`, '관주를 지우지 못했습니다')
