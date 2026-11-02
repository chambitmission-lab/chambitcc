// 우리반 하위 화면(리포트·출석부·앨범) 이동 — 청크와 첫 요청을 손이 닿는 순간 같이 데우고,
// 못 받았으면 눌린 행에 스피너를 띄운 뒤 받아서 간다 (ClassList goClass 와 같은 문법).
// 라우터가 전환을 startTransition 으로 돌려 청크가 올 때까지 반 홈이 멈춰 보이던 곳.
import { queryClient } from '../../config/queryClient'
import { prefetchClassSubPage, type ClassSubPage } from '../../hooks/useClassRoom'
import { isRoutePreloaded, preloadRoute } from '../../utils/routePreload'

export type { ClassSubPage }

export const classSubPagePath = (classId: number, page: ClassSubPage): string =>
  `/classes/${classId}/${page}`

/** 호버·터치 — 청크 + 첫 데이터. 둘 다 중복 호출이 걸러진다 */
export const warmClassSubPage = (classId: number, page: ClassSubPage): void => {
  void preloadRoute(classSubPagePath(classId, page))
  prefetchClassSubPage(queryClient, classId, page)
}

/** 유휴 때 청크만 — 반 홈에서 가장 자주 누르는 목적지라 미리 받아 둔다 (데이터는 호버·터치 때) */
export const warmClassSubPageChunks = (pages: ClassSubPage[], classId: number): void => {
  for (const page of pages) void preloadRoute(classSubPagePath(classId, page), { idle: true })
}

/**
 * 이동. 청크가 이미 있으면 즉시, 없으면 onPending(page)…onPending(null) 사이에 받아서 간다.
 * 데이터 선요청은 함께 출발시켜 화면이 뜰 때 응답이 도착해 있게 한다.
 */
export const goClassSubPage = async (
  classId: number,
  page: ClassSubPage,
  navigate: (path: string, options?: { replace?: boolean }) => void,
  onPending?: (pending: ClassSubPage | null) => void,
  options?: { replace?: boolean },
): Promise<void> => {
  const path = classSubPagePath(classId, page)
  prefetchClassSubPage(queryClient, classId, page)
  if (!isRoutePreloaded(path)) {
    onPending?.(page)
    try {
      await preloadRoute(path)
    } finally {
      onPending?.(null)
    }
  }
  navigate(path, options)
}
