import { queryOptions, useQuery } from '@tanstack/react-query'
import { getBibleChapter } from '../../../api/bible'
import { bibleKeys } from '../../../hooks/queryKeys'
import type { BibleVerse } from '../../../types/bible'
import { loadEpisodeBody } from './data'
import type { StoryEpisode, StoryVerseRef } from './storyTypes'

// 에피소드 화면이 받는 두 가지 — 본문 청크와 원문 맛보기 절.
// 옵션을 한 곳에 두어 화면(useQuery)과 지도의 선요청(storyWarm)이 같은 키·staleTime 을 쓴다.

const DAY = 1000 * 60 * 60 * 24

/** 화 본문 — 막 단위 청크. 정적 데이터라 한 번 받으면 세션 내내 신선하다 */
export const episodeBodyQuery = (episodeId: string) =>
  queryOptions({
    queryKey: bibleKeys.storyBody(episodeId),
    queryFn: () => loadEpisodeBody(episodeId),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })

export const useEpisodeBody = (episodeId: string) =>
  useQuery({ ...episodeBodyQuery(episodeId), enabled: episodeId.length > 0 })

// 원문 맛보기 — 절 본문은 기존 성경 API에서 런타임에 가져온다 (번역본 일치, 데이터 중복 없음)
export interface FetchedRef {
  ref: StoryVerseRef
  verses: BibleVerse[]
}

/** 이 화가 인용하는 절 전부 — 특별편은 구약 약속 뒤에 신약 성취가 이어진다 */
export const episodeRefs = (body: StoryEpisode): StoryVerseRef[] => [
  ...body.verseRefs,
  ...(body.promise?.fulfillRefs ?? []),
]

// 절마다 /bible/verse 를 따로 부르지 않고 참조당 장 1회만 받아 필요한 절을 골라낸다.
// 한 화에 같은 장을 두 번 참조하면 그 장은 한 번만 요청한다.
export const fetchEpisodeVerses = async (refs: StoryVerseRef[]): Promise<FetchedRef[]> => {
  const chapterKey = (book: number, chapter: number) => `${book}:${chapter}`
  const chapterFetches = new Map<string, ReturnType<typeof getBibleChapter>>()
  for (const ref of refs) {
    const key = chapterKey(ref.book, ref.chapter)
    if (!chapterFetches.has(key)) chapterFetches.set(key, getBibleChapter(ref.book, ref.chapter))
  }

  return Promise.all(
    refs.map(async ref => {
      const chapter = await chapterFetches.get(chapterKey(ref.book, ref.chapter))!
      const byVerse = new Map(chapter.verses.map(v => [v.verse, v]))
      // 병합 구간(신 6:18-19)은 자리표시자 절의 본문이 비어 있다 — 묶음 첫 절로
      // 옮겨 잡고 중복은 걸러낸다(18·19를 함께 인용해도 한 번만 나오게)
      const picked = ref.verses.map(n => {
        const v = byVerse.get(n)
        return v?.merged_into ? byVerse.get(v.merged_into) : v
      })
      const seen = new Set<number>()
      const verses = picked.filter((v): v is BibleVerse => {
        if (!v || seen.has(v.id)) return false
        seen.add(v.id)
        return true
      })
      return { ref, verses }
    })
  )
}

export const episodeVersesQuery = (episodeId: string, refs: StoryVerseRef[]) =>
  queryOptions({
    queryKey: bibleKeys.storyVerses(episodeId),
    queryFn: () => fetchEpisodeVerses(refs),
    staleTime: DAY,
    gcTime: DAY * 7,
    retry: 1,
  })

/** 본문이 아직 없으면(청크 로딩 중) 켜지 않는다 — refs 는 본문에서 나온다 */
export const useEpisodeVerses = (episodeId: string, refs: StoryVerseRef[] | undefined) =>
  useQuery({ ...episodeVersesQuery(episodeId, refs ?? []), enabled: !!refs && refs.length > 0 })
