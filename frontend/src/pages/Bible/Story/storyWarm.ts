import type { QueryClient } from '@tanstack/react-query'
import { preloadBudget } from '../../../utils/idlePreload'
import { preloadRoute } from '../../../utils/routePreload'
import type { ThemeName } from '../../../utils/themeAssets'
import { episodeBodyQuery, episodeRefs, episodeVersesQuery } from './storyQueries'

// 지도 → 에피소드 전환 예열.
//
// 화 카드를 누르면 에피소드 청크 → 본문 청크 → 절 API → 히어로 그림이 직렬로 이어져
// 첫 화면까지 네 박자였다. 손가락이 닿거나(pointerdown) 마우스가 올라오는 순간, 그리고
// 지도가 뜬 뒤 유휴 시간에 "이어서 읽을" 화를 미리 받아 두면 탭 즉시 본문이 선다.
// 실패는 전부 조용히 무시한다 — 진입하면 화면 훅이 다시 받는다.

/** 에피소드 청크 + 본문(막 청크). 호버 때처럼 가볍게 — 전부 우리 정적 파일이라 API 요청이 없다 */
export const warmEpisodeShell = (queryClient: QueryClient, episodeId: string): void => {
  void preloadRoute(`/bible/story/${episodeId}`)
  void queryClient.prefetchQuery(episodeBodyQuery(episodeId)).catch(() => undefined)
}

/** 원문 맛보기 절(장 API)과 히어로 그림까지 — 터치·유휴 때. 절약 모드/2G 에선 셸만 받는다 */
export const warmEpisode = (queryClient: QueryClient, episodeId: string, theme: ThemeName): void => {
  warmEpisodeShell(queryClient, episodeId)
  if (preloadBudget() !== 'full') return
  void queryClient
    .ensureQueryData(episodeBodyQuery(episodeId))
    .then(body => {
      if (!body) return
      const refs = episodeRefs(body)
      if (refs.length > 0) return queryClient.prefetchQuery(episodeVersesQuery(episodeId, refs))
    })
    .catch(() => undefined)
  // 그림 URL 맵(59장 해시 경로)은 에피소드·완주 화면 몫이라 지도 청크에 싣지 않고 여기서 늦게 받는다
  void import('./storyImages')
    .then(m => {
      const url = m.storyImage(episodeId, theme)
      if (url) new Image().src = url
    })
    .catch(() => undefined)
}
