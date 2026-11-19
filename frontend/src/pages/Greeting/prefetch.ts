// /greeting 데이터 선요청 — 청크 프리로드(메뉴 열림·호버·유휴)와 같은 시점에 호출된다.
//
// 청크만 미리 받아두면 진입 시 히어로는 즉시 뜨지만 편지는 API 왕복(~150ms), 사진은
// 그 뒤 왕복을 더 기다려 세 박자로 나뉘어 그려졌다. 여기서 응답과 사진을
// 함께 데워 두면 진입 시 한 프레임에 그려진다.
//
// 화면이 실제로 그리는 건 오린 사진(cutPortraits.ts)이 우선이고 photo_url 은 대체다.
// 예전엔 photo_url 만 데워 정작 보이는 오린 사진은 진입 후에야 요청됐다.
import { queryClient } from '../../config/queryClient'
import { fetchPastors } from '../../api/pastors'
import { pastorKeys } from '../../hooks/usePastors'
import { readPastorsCache } from '../../utils/pastorsCache'
import { cutPortraitFor, warmCutPortraits, warmImage } from './cutPortraits'

export const prefetch = (): void => {
  // 응답을 기다리지 않고 바로 데운다 — 지난 방문 캐시가 있으면 그 사람 기준
  const cached = readPastorsCache()
  warmCutPortraits(cached ? (cached.current?.name_ko ?? null) : undefined)
  if (cached && !cutPortraitFor(cached.current?.name_ko)) warmImage(cached.current?.photo_url)
  void queryClient
    .fetchQuery({ queryKey: pastorKeys.all, queryFn: fetchPastors, staleTime: 1000 * 60 * 5 })
    .then((data) => {
      const cut = cutPortraitFor(data.current?.name_ko)
      warmImage(cut || data.current?.photo_url)
    })
    .catch(() => {
      /* 오프라인 등 — 진입 시 훅이 다시 시도한다 */
    })
}
