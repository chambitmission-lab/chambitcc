import type { ComponentType } from 'react'

type RouteLoader = () => Promise<{ default: ComponentType }>

// 햄버거 메뉴에서 진입하는 lazy 페이지들의 동적 import를 한곳에 모음.
// App.tsx의 lazy()와 같은 함수를 공유해야 프리로드한 청크가 그대로 재사용된다.
export const menuRouteLoaders: Record<string, RouteLoader> = {
  '/about': () => import('../pages/About/About'),
  '/worship': () => import('../pages/Worship/Worship'),
  '/events': () => import('../pages/Events/EventCalendar'),
  '/culture': () => import('../pages/Culture/Culture'),
  '/sermon': () => import('../pages/Sermon/Sermon'),
  '/bible': () => import('../pages/Bible/BibleStudy'),
  '/ministry': () => import('../pages/Ministry/Ministry'),
  '/groups': () => import('../pages/Groups/MyGroups'),
  '/mission': () => import('../pages/Mission/Mission'),
  '/news': () => import('../pages/News/News'),
  '/garden': () =>
    import('../pages/Garden/Garden').then((m) => ({ default: m.Garden })),
  '/bluemarble': () => import('../pages/Bluemarble/Bluemarble'),
  '/answered-prayers': () => import('../pages/Prayer/AnsweredPrayers'),
  '/account': () => import('../pages/Account/AccountSettings'),
  '/profile': () => import('../pages/Profile/Profile'),
}

const preloaded = new Set<string>()

// 실패(오프라인 등) 시 Set에서 제거해 다음 기회에 재시도할 수 있게 한다
export const preloadRoute = (path: string): Promise<void> => {
  const loader = menuRouteLoaders[path]
  if (!loader || preloaded.has(path)) return Promise.resolve()
  preloaded.add(path)
  return loader()
    .then(() => undefined)
    .catch(() => {
      preloaded.delete(path)
    })
}

// 메뉴가 열리는 순간 호출 — 네트워크를 몰아치지 않게 순차로 받는다
export const preloadMenuRoutes = async (): Promise<void> => {
  for (const path of Object.keys(menuRouteLoaders)) {
    await preloadRoute(path)
  }
}

// 첫 화면 렌더가 끝난 뒤 브라우저 유휴 시간에 미리 받아두기
export const schedulePreloadOnIdle = (): void => {
  const run = () => {
    void preloadMenuRoutes()
  }
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 5000 })
  } else {
    setTimeout(run, 2500)
  }
}
