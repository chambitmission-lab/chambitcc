// React Query 캐시 모양 — setQueryData/setQueriesData 콜백의 `old` 타입.
// 무한 스크롤 캐시는 InfiniteData<페이지응답> 이라 훅마다 다시 적기 번거롭고,
// 잘못 적으면 any 로 도망가게 된다. 자주 쓰는 것만 여기 모아 둔다.
import type { InfiniteData } from '@tanstack/react-query'
import type { PrayerListResponse } from './prayer'
import type { PostsResponse } from '../api/community'

/** 기도 목록 무한 스크롤 (prayerKeys.list(...)) */
export type PrayerListCache = InfiniteData<PrayerListResponse>

/** 커뮤니티 게시물 무한 스크롤 (communityKeys.posts(sort)) */
export type CommunityPostsCache = InfiniteData<PostsResponse>

/**
 * apiFetch 래퍼가 던지는 에러 — 서버 응답 본문이 함께 붙어 오는 경우가 있다.
 * (axios 시절 코드가 error.response.data.detail 을 읽던 흔적이 남아 있어
 *  옵셔널로 두고 message 폴백과 함께 쓴다)
 */
export type ApiError = Error & {
  response?: { status?: number; data?: { detail?: string; message?: string } }
}
