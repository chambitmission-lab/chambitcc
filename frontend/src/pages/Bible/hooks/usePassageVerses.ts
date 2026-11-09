import { useMemo } from 'react'
import { useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import { useBibleChapter } from '../../../hooks/useBible'
import { bibleKeys } from '../../../hooks/queryKeys'
import type { BibleChapterPaginatedResponse, BibleVerse } from '../../../types/bible'
import type { PassageRef } from '../data/crossRefs'

const inRange = (r: PassageRef, v: BibleVerse) => v.verse >= r.v && v.verse <= r.to && !!v.text

/**
 * 읽기 화면(BibleStudy)이 받아 둔 페이지 캐시에서 이 범위를 꺼낸다.
 * 읽기 화면은 장을 20절씩 페이지 키로 받고, 시트는 전체 장 키를 쓰므로 키가 달라 같은 장이어도
 * 요청이 한 번 더 나갔다. 범위 끝까지 이미 받은 상태일 때만 답한다 — 아직 안 받은 페이지에 있을 수 있는
 * 절을 "없다"고 하지 않게.
 */
const pickFromReaderPages = (qc: QueryClient, r: PassageRef): BibleVerse[] | null => {
  const data = qc.getQueryData<InfiniteData<BibleChapterPaginatedResponse>>(bibleKeys.chapterInfinite(r.b, r.c))
  if (!data?.pages.length) return null
  const verses = data.pages.flatMap((p) => p.verses)
  const last = data.pages[data.pages.length - 1]
  const lastVerse = verses.length ? verses[verses.length - 1].verse : 0
  if (last.has_more && lastVerse < r.to) return null
  return verses.filter((v) => inRange(r, v))
}

/**
 * 한 본문 범위(사 7:14 · 마 1:22-23)의 절들 — 연결 구절·약속 시트가 인용할 때.
 * 읽기 화면 캐시에 있으면 요청 없이 바로 주고, 없을 때만 전체 장(useBibleChapter)을 받는다.
 */
export const usePassageVerses = ({ b, c, v, to }: PassageRef): { verses: BibleVerse[]; isLoading: boolean } => {
  const qc = useQueryClient()
  const fromReader = useMemo(() => pickFromReaderPages(qc, { b, c, v, to }), [qc, b, c, v, to])
  const { data, isLoading } = useBibleChapter(b, c, !fromReader)
  const verses = useMemo(
    () => fromReader ?? (data?.verses ?? []).filter((x) => inRange({ b, c, v, to }, x)),
    [fromReader, data, b, c, v, to],
  )
  return { verses, isLoading: !fromReader && isLoading }
}
