// 설교 메모장 공용 헬퍼 — 무효화 · 칩 스타일 · 성경 링크 (쿼리 키는 hooks/queryKeys 의 pastorKeys)
import type { QueryClient } from '@tanstack/react-query'
import { pastorKeys } from '../../../hooks/queryKeys'

/** 메모·개요를 바꾼 뒤 — 메모가 보이는 모든 곳 */
export const invalidateNoteQueries = (qc: QueryClient) => {
  for (const key of [pastorKeys.notes(), pastorKeys.relatedNotes(), pastorKeys.outlineAll(), pastorKeys.outlines()]) {
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
