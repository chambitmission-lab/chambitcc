// 우리 교회 말씀 — 주일 설교 본문을 말씀 카드의 출발점으로.
// 온 교회가 같은 주에 같은 본문으로 카드를 만들면 단톡방·프로필에서 말씀이 한 주 내내 이어진다
// (YouVersion '오늘의 말씀' 이미지의 문법을 교회 단위로).
//
// 설교 목록은 홈·랜딩과 같은 경량 목록 키(useSermons(0, 1, false)), 본문은 성경 화면과 같은 장 캐시 칸을 쓴다.

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBibleChapter } from '../../../api/bible'
import { bibleKeys } from '../../../hooks/queryKeys'
import { useSermons } from '../../../hooks/useSermons'
import type { BibleVerse } from '../../../types/bible'
import { formatReference, parseBibleReference } from '../../Sermon/utils/sermonMeta'
import type { ParsedReference } from '../../Sermon/utils/sermonMeta'
import { todayYmd } from '../Plans/planSchedule'

/** 카드로 담을 설교 본문 — 최근 주일 설교 또는 설교 화면에서 실어 보낸 본문 */
export interface SermonPassage {
  /** 설교에 적힌 성구 원문 ("요한복음 12장 20~33절") */
  ref: string
  title: string
  /** 피커 배지 문구 — '이번 주일 설교' 등. 없으면 '설교 본문' */
  badge?: string
}

const DAY_MS = 86_400_000
/** 이보다 지난 설교는 '이번 주 말씀'으로 권하지 않는다 */
const RECENT_DAYS = 13

const daysBetween = (a: string, b: string): number =>
  Math.round((Date.parse(`${b}T00:00:00`) - Date.parse(`${a}T00:00:00`)) / DAY_MS)

/** 최근 주일 설교 본문 — 2주 안에 올라온 설교가 없거나 성구를 못 읽으면 null */
export const useRecentSermonPassage = (lang: 'ko' | 'en'): SermonPassage | null => {
  const { data } = useSermons(0, 1, false)
  return useMemo(() => {
    const s = data?.[0]
    if (!s?.bible_verse || !s.sermon_date) return null
    const parsed = parseBibleReference(s.bible_verse)
    if (parsed?.bookNumber == null) return null
    const ago = daysBetween(s.sermon_date.slice(0, 10), todayYmd())
    if (ago < -1 || ago > RECENT_DAYS) return null
    const badge =
      lang === 'en'
        ? ago <= 6 ? "This Sunday's sermon" : "Last Sunday's sermon"
        : ago <= 6 ? '이번 주일 설교 말씀' : '지난 주일 설교 말씀'
    return { ref: s.bible_verse, title: s.title, badge }
  }, [data, lang])
}

/** 본문 성구를 표시용으로 — 못 읽으면 원문 그대로 */
export const passageLabel = (ref: string): string => {
  const parsed = parseBibleReference(ref)
  return parsed ? formatReference(parsed) : ref
}

/** 설교 본문 절 목록 — 장 전체를 받아 범위만 자른다. enabled 일 때만 요청 */
export const usePassageVerses = (
  ref: string | undefined,
  enabled: boolean,
): { parsed: ParsedReference | null; verses: BibleVerse[]; isLoading: boolean } => {
  const parsed = useMemo(() => (ref ? parseBibleReference(ref) : null), [ref])
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
    const to = parsed.verseEnd ?? parsed.verse ?? Number.MAX_SAFE_INTEGER
    return chapter.verses
      .filter((v) => v.verse >= from && v.verse <= to && v.merged_into == null)
      .map((v) => ({ ...v, book_name_ko: v.book_name_ko || chapter.book_name_ko }))
  }, [chapter, parsed])
  return { parsed, verses, isLoading: enabled && bookNumber != null && isLoading }
}
