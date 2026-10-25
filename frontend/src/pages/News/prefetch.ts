// /news 진입 선요청 — RouteDataPrefetch(Suspense 바깥)에서 lazy 청크와 나란히 띄운다.
//
// 공유 링크(#/news?tab=bulletin&b=28)로 들어오면 예전엔 청크 → 마운트 → 목록 → (목록 뒤) 상세 →
// 쪽 그림이 전부 직렬이라 소식 목록이 한 번 다 그려진 뒤에 뷰어로 갈아탔다.
// 여기서 상세·목록을 동시에 출발시키고, 상세가 오는 즉시 첫 쪽·옆 쪽 그림까지 받아 두면
// News 가 마운트될 때쯤 캐시가 차 있어 뷰어가 한 번에 뜬다.
// (훅과 같은 queryKey·queryFn 이라 화면이 캐시를 그대로 이어받는다 — 조회수도 한 번만 오른다)
import type { QueryClient } from '@tanstack/react-query'
import { queryClient } from '../../config/queryClient'
import { getBulletinDetail } from '../../api/bulletin'
import { bulletinKeys, prefetchBulletinList } from '../../hooks/useBulletins'
import { warmPagesAround } from './components/bulletinWarm'
import type { Bulletin } from '../../types/bulletin'

/** 공유 링크의 b 파라미터 — 없거나 숫자가 아니면 null */
export const bulletinDeepLinkId = (search: string): number | null =>
  Number(new URLSearchParams(search).get('b')) || null

export const prefetchBulletinDeepLink = async (id: number, qc: QueryClient = queryClient): Promise<void> => {
  await qc.prefetchQuery({
    queryKey: bulletinKeys.detail(id),
    queryFn: () => getBulletinDetail(id),
  })
  // 뷰어가 처음 펼칠 첫 쪽과 옆 쪽 — 상세가 오는 즉시 받기 시작한다
  warmPagesAround(qc.getQueryData<Bulletin>(bulletinKeys.detail(id))?.pages, 0)
}

/** /news 라우트 진입 — 주보 탭이면 목록을, 공유 링크면 그 주보 상세까지 */
export const prefetchNewsRoute = (search: string, qc: QueryClient = queryClient): void => {
  const params = new URLSearchParams(search)
  if (params.get('tab') !== 'bulletin') return
  void prefetchBulletinList(qc)
  const id = bulletinDeepLinkId(search)
  if (id) void prefetchBulletinDeepLink(id, qc)
}
