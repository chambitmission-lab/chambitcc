import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBibleChapter } from '../../../api/bible'
import { bibleKeys } from '../../../hooks/queryKeys'
import type { ParsedReference } from '../utils/sermonMeta'

// 설교 본문 범위 — 장 전체를 받아 범위만 자른다(성경 화면과 같은 캐시 칸).
// 말씀 편지의 '본문 읽기'와 설교 영상 극장이 같은 쿼리를 쓴다.
export const useSermonPassage = (parsed: ParsedReference | null, enabled: boolean) => {
  const bookNumber = parsed?.bookNumber ?? null
  const { data: chapter, isLoading } = useQuery({
    queryKey: bibleKeys.chapter(bookNumber ?? 0, parsed?.chapter ?? 0),
    queryFn: () => getBibleChapter(bookNumber!, parsed!.chapter),
    enabled: enabled && bookNumber != null,
    staleTime: Infinity,
  })
  const verses = useMemo(() => {
    if (!chapter || !parsed) return []
    const from = parsed.verse ?? 1
    const to = parsed.verseEnd ?? (parsed.verse ?? Number.MAX_SAFE_INTEGER)
    return chapter.verses.filter((v) => v.verse >= from && v.verse <= to && v.merged_into == null)
  }, [chapter, parsed])
  return { verses, isLoading: enabled && bookNumber != null && isLoading }
}
