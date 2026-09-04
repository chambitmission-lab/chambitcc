// /greeting 데이터 선요청 — 청크 프리로드(메뉴 열림·호버·유휴)와 같은 시점에 호출된다.
//
// 청크만 미리 받아두면 진입 시 히어로는 즉시 뜨지만 편지는 API 왕복(~150ms), 사진은
// 그 뒤 R2 왕복(~170ms)을 더 기다려 세 박자로 나뉘어 그려졌다. 여기서 응답과 사진을
// 함께 데워 두면 진입 시 한 프레임에 그려진다.
import { queryClient } from '../../config/queryClient'
import { fetchPastors } from '../../api/pastors'
import { pastorKeys } from '../../hooks/usePastors'
import { readPastorsCache } from '../../utils/pastorsCache'

const warmed = new Set<string>()

/** 브라우저 HTTP 캐시(R2 는 immutable 1년)에 사진을 넣어 둔다 */
const warmPhoto = (url: string | null | undefined) => {
  const src = url?.trim()
  if (!src || warmed.has(src)) return
  warmed.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

export const prefetch = (): void => {
  // 지난 방문 사진은 응답을 기다리지 않고 바로 데운다
  warmPhoto(readPastorsCache()?.current?.photo_url)
  void queryClient
    .fetchQuery({ queryKey: pastorKeys.all, queryFn: fetchPastors, staleTime: 1000 * 60 * 5 })
    .then((data) => warmPhoto(data.current?.photo_url))
    .catch(() => {
      /* 오프라인 등 — 진입 시 훅이 다시 시도한다 */
    })
}
