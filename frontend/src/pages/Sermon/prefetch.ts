// /sermon 데이터 선요청 — 두 시점에서 호출된다 (/bible 허브 prefetch 와 같은 문법).
//   1. 청크 프리로드(routePreload.routeDataPrefetchers): 유휴 프리로드·메뉴 열림·항목 호버/터치
//   2. 라우트 진입(components/common/RouteDataPrefetch): Suspense 바깥이라 청크 다운로드와 나란히
//
// 예전엔 청크 → 마운트 → 목록 API → (목록 도착 뒤) 히어로 인용절 API 가 전부 직렬이라
// 첫 진입은 스켈레톤 뒤에 인용 자리가 한 박자 늦게 채워지는 "두 박자" 였다.
// 목록은 훅(useInfiniteSermons)과 같은 키·queryFn·staleTime 이라 진입 시 캐시를 그대로 이어받고,
// 최신 설교의 인용절(useSermonLeadVerse 와 같은 키)까지 여기서 미리 받아 히어로가 한 번에 그려진다.
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { queryClient } from '../../config/queryClient'
import { getSermons } from '../../api/sermon'
import { getBibleVerse } from '../../api/bible'
import { sermonKeys } from '../../hooks/queryKeys'
import { SERMON_PAGE_SIZE, SERMON_STALE_MS } from '../../hooks/useSermons'
import type { Sermon } from '../../types/sermon'
import { parseBibleReference } from './utils/sermonMeta'
import { sermonLeadVerseKey } from './hooks/useSermonLeadVerse'

export const prefetchSermonPage = async (qc: QueryClient = queryClient): Promise<void> => {
  // 신선한 캐시(persist 복원 포함)가 있으면 요청 없이 끝난다
  await qc.prefetchInfiniteQuery({
    queryKey: sermonKeys.infinite(),
    queryFn: ({ pageParam }) => getSermons(pageParam as number, SERMON_PAGE_SIZE),
    initialPageParam: 0,
    staleTime: SERMON_STALE_MS,
  })

  const first = qc.getQueryData<InfiniteData<Sermon[]>>(sermonKeys.infinite())?.pages[0]?.[0]
  if (!first) return
  const parsed = parseBibleReference(first.bible_verse)
  if (parsed?.bookNumber == null) return
  void qc.prefetchQuery({
    queryKey: sermonLeadVerseKey(parsed),
    queryFn: () => getBibleVerse(parsed.bookNumber!, parsed.chapter, parsed.verse ?? 1),
    staleTime: Infinity,
  })
}
