// 설교 메모장 공용 헬퍼 — 쿼리 키 · 무효화 · 칩 스타일 · 성경 링크
import type { QueryClient } from '@tanstack/react-query'
import type { NoteFilters } from '../../../api/pastor'

/** 메모 목록 쿼리 키 — 설교 준비 화면의 요약 카드와 메모장 첫 화면이 같은 캐시를 쓴다 */
export const noteListKey = (f: NoteFilters = {}) =>
  ['pastor-notes', f.q?.trim() ?? '', f.kind ?? null, f.tag ?? null, f.topic ?? null, f.book ?? null, !!f.unused] as const

/** 메모·개요를 바꾼 뒤 — 메모가 보이는 모든 곳 */
export const invalidateNoteQueries = (qc: QueryClient) => {
  for (const key of [['pastor-notes'], ['pastor-note-related'], ['pastor-outline'], ['pastor-outlines'], ['pastor-note']]) {
    void qc.invalidateQueries({ queryKey: key })
  }
}

export const chipCls = (active: boolean) =>
  `px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-full border text-[12.5px] lg:text-[14px] font-semibold transition-colors ${
    active
      ? 'bg-brand border-brand text-white'
      : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand'
  }`

export const bibleLink = (book: number, chapter: number, verse?: number | null) =>
  `/bible/${book}/${chapter}${verse ? `?verse=${verse}` : ''}`
