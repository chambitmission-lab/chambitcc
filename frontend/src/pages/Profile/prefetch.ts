// /profile 데이터 선요청 — 두 시점에서 호출된다 (pages/Bible/prefetch.ts 와 같은 규약).
//   1. 청크 프리로드(routePreload.routeDataPrefetchers): 하단 네비 유휴 프리로드 → coldOnly
//   2. 라우트 진입(components/common/RouteDataPrefetch): Suspense 바깥이라 청크 다운로드와 나란히
//
// 예전엔 Profile 이 마운트된 뒤에야 detail·블루마블 통계 요청이 나갔고, 그 아래 카드들
// (여정 요약·최근 14일·장착 칭호)은 detail 이 도착해 본문이 그려진 다음에야 요청을 시작했다 —
// 청크 → detail → 카드 데이터 3단 직렬. 전부 같은 시점에 띄운다.
// 키·staleTime 은 각 훅과 같아 진입 시 캐시를 그대로 이어받는다. 이미 신선하면 요청하지 않는다.
import type { QueryClient } from '@tanstack/react-query'
import { queryClient } from '../../config/queryClient'
import { prefetchProfileDetail, prefetchMyPrayers } from '../../hooks/useProfile'
import { QK_BM_STATS } from '../../hooks/useBluemarble'
import { growthKeys } from '../../hooks/useGrowth'
import { titleKeys } from '../../hooks/useTitles'
import { fetchBluemarbleStats } from '../../api/bluemarble'
import { getGrowthSummary, getGrowthTimeline } from '../../api/growth'
import { getEquippedTitle } from '../../api/titles'
import type { TitleStatus } from '../../api/titles'
import { isAuthenticated } from '../../utils/auth'
import { warmTitleBackdrop } from '../../components/titles/TitleBackdrop'
import { readCoverHintKey } from './coverHint'
import { warmProfileFontsFromCache, warmProfileFontsStatic } from './warmup'

const FIVE_MIN = 1000 * 60 * 5
// FaithInsightCard·GrowthHook·WeeklyStoryHook 이 공유하는 최근 활동 창(일)
const RECENT_DAYS = 14

export const prefetchProfile = (qc: QueryClient = queryClient, coldOnly = false): void => {
  // 전부 인증 필수 — 비로그인엔 훅도 꺼져 있다
  if (!isAuthenticated()) return
  const staleTime = coldOnly ? Infinity : FIVE_MIN

  // 손글씨(Gaegu) 고정 라벨 조각·지난 방문의 커버 배너 — 데이터와 나란히 받는다. 둘 다 데이터가 다
  // 도착한 뒤 본문이 그려질 때야 요청이 시작되던 것이라, 여기서 띄우면 그만큼 직렬 구간이 사라진다
  warmProfileFontsStatic()
  warmTitleBackdrop(readCoverHintKey())

  // detail 이 오면(또는 캐시가 신선하면) 실제 그려질 이름·제목·댓글 글자 조각까지 예열
  void prefetchProfileDetail(qc, coldOnly).then(() => warmProfileFontsFromCache(qc))
  // 기본 탭 목록 첫 페이지 — persist 되지 않는 쿼리라 유휴(coldOnly)에선 받지 않고 진입 시에만
  if (!coldOnly) prefetchMyPrayers(qc)
  void qc.prefetchQuery({ queryKey: QK_BM_STATS, queryFn: fetchBluemarbleStats, staleTime })
  void qc.prefetchQuery({ queryKey: growthKeys.summary, queryFn: getGrowthSummary, staleTime })
  void qc.prefetchQuery({
    queryKey: [...growthKeys.recent, RECENT_DAYS],
    queryFn: () => getGrowthTimeline(undefined, RECENT_DAYS),
    staleTime,
  })
  // 칭호 응답이 오면 그 키의 배너를 받는다 — 힌트와 같은 키면 위에서 이미 받고 있어 무시된다
  void qc
    .prefetchQuery({ queryKey: titleKeys.equipped(), queryFn: getEquippedTitle, staleTime })
    .then(() => warmTitleBackdrop(qc.getQueryData<TitleStatus | null>(titleKeys.equipped())?.key))
}
