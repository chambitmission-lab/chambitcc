import type { ComponentType } from 'react'

type RouteLoader = () => Promise<{ default: ComponentType }>

// 햄버거 메뉴에서 진입하는 lazy 페이지들의 동적 import를 한곳에 모음.
// App.tsx의 lazy()와 같은 함수를 공유해야 프리로드한 청크가 그대로 재사용된다.
export const menuRouteLoaders: Record<string, RouteLoader> = {
  '/about': () => import('../pages/About/About'),
  '/history': () => import('../pages/History/History'),
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
  '/prayer-focus': () => import('../pages/PrayerFocus'),
}

// 하단 네비 목적지 — 사용자가 가장 먼저 누르는 곳이라 메뉴 페이지들보다 먼저 받아둔다
export const NAV_ROUTES = ['/bible', '/prayer-focus', '/profile']

// 진행 중인 로드는 promise 자체를 캐싱한다. Set으로 "시작했음"만 기록하면
// 아직 안 끝난 로드에 await 해도 즉시 resolve돼서 청크 없이 이동하게 된다.
const inflight = new Map<string, Promise<void>>()
const loaded = new Set<string>()

// 이미 받아둔 청크인지 동기로 확인 — 스피너를 한 프레임도 깜빡이지 않게 하는 데 쓴다
export const isRoutePreloaded = (path: string): boolean => loaded.has(path)

// 실패(오프라인 등) 시 캐시에서 제거해 다음 기회에 재시도할 수 있게 한다
export const preloadRoute = (path: string): Promise<void> => {
  const cached = inflight.get(path)
  if (cached) return cached

  const loader = menuRouteLoaders[path]
  if (!loader) return Promise.resolve()

  const promise = loader()
    .then(() => {
      loaded.add(path)
    })
    .catch(() => {
      inflight.delete(path)
    })
  inflight.set(path, promise)
  return promise
}

// 하단 네비 3개는 동시에 받는다 (순차로 돌리면 마지막 것이 몇 초씩 밀린다)
export const preloadNavRoutes = (): Promise<void> =>
  Promise.all(NAV_ROUTES.map(preloadRoute)).then(() => undefined)

// 메뉴가 열리는 순간 호출 — 네트워크를 몰아치지 않게 순차로 받는다
export const preloadMenuRoutes = async (): Promise<void> => {
  // 네비 목적지를 먼저 확보한 뒤 나머지 메뉴 페이지를 채운다
  await preloadNavRoutes()
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
