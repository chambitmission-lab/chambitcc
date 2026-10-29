// lazy 라우트로 이동 — 청크가 아직 안 왔으면 받는 동안 pending 을 알려 준다.
// 라우터(v7)는 화면 전환을 startTransition 으로 돌려서 청크가 도착할 때까지 Suspense fallback 없이
// 이전 화면을 그대로 붙잡는다 → 버튼을 눌러도 "안 눌린 것처럼" 멈춰 보인다. NewHome·DesktopNavRail·
// ClassList 가 각자 들고 있던 goLazy 문법을 훅으로 모았다: 호출부는 pending 으로 눌린 버튼에 스피너를 띄운다.
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isRoutePreloaded, preloadRoute } from '../utils/routePreload'

export const useLazyNavigate = () => {
  const navigate = useNavigate()
  const [pending, setPending] = useState<string | null>(null)

  const go = useCallback(
    async (path: string) => {
      if (isRoutePreloaded(path)) {
        navigate(path)
        return
      }
      setPending(path)
      try {
        // 프리로드 테이블에 없는 경로는 즉시 돌아온다 — 그냥 이동
        await preloadRoute(path)
      } finally {
        setPending(null)
      }
      navigate(path)
    },
    [navigate],
  )

  return { go, pending }
}
