// /bible 허브 데이터 선요청 — 두 시점에서 호출된다.
//   1. 청크 프리로드(routePreload.routeDataPrefetchers): 하단 네비 유휴 프리로드·메뉴 열림·호버
//   2. 라우트 진입(components/common/RouteDataPrefetch): Suspense 바깥이라 청크 다운로드와 나란히
//
// 예전엔 허브가 마운트된 뒤에야 책 목록·진행률·이어읽기 요청이 나갔다 — 청크 왕복 + API 왕복이
// 직렬이었고, 콜드(배포 직후는 persist 캐시가 통째로 비워진다)에선 그 시간만큼 스피너였다.
// 키·staleTime 은 각 훅과 같아 진입 시 캐시를 그대로 이어받는다. 이미 신선하면 요청하지 않는다.
import type { QueryClient } from '@tanstack/react-query'
import { queryClient } from '../../config/queryClient'
import { prefetchBibleBooks } from '../../hooks/useBible'
import { prefetchReadingState } from '../../hooks/useBibleReading'
import { isAuthenticated } from '../../utils/auth'

export const prefetchBibleHub = (qc: QueryClient = queryClient): void => {
  prefetchBibleBooks(qc)
  // 진행률·이어읽기는 인증 필수 — 비로그인엔 훅도 꺼져 있다(enabled: isLoggedIn())
  if (isAuthenticated()) prefetchReadingState(qc)
}
