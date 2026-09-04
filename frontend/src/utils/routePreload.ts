import type { ComponentType } from 'react'

type RouteLoader = () => Promise<{ default: ComponentType }>

// 햄버거 메뉴에서 진입하는 lazy 페이지들의 동적 import를 한곳에 모음.
// App.tsx의 lazy()와 같은 함수를 공유해야 프리로드한 청크가 그대로 재사용된다.
export const menuRouteLoaders: Record<string, RouteLoader> = {
  '/about': () => import('../pages/About/About'),
  '/greeting': () => import('../pages/Greeting/Greeting'),
  '/visit': () => import('../pages/Visit/Visit'),
  '/organization': () => import('../pages/Organization/Organization'),
  '/history': () => import('../pages/History/History'),
  '/worship': () => import('../pages/Worship/Worship'),
  '/education': () => import('../pages/Education/Education'),
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
  // PC 좌측 레일 "신앙 여정"
  '/growth': () => import('../pages/Growth/Growth'),
  // 홈 FAB 스피드 다이얼의 "말씀 카드 만들기" 목적지
  '/bible/photo-verse': () => import('../pages/Bible/PhotoVerse/PhotoVerse'),
  '/classes': () => import('../pages/ClassRoom/ClassList'),
}

// 청크와 함께 데워 둘 페이지 데이터. 청크만 먼저 받으면 진입 시 껍데기(히어로)는 즉시
// 뜨는데 본문은 API 왕복만큼 늦게 따라와 "두 박자"로 그려진다 — 같은 타이밍에 응답과
// 첫 화면 이미지를 미리 받아 둔다. 청크가 처음 로드될 때 한 번만 호출된다.
const routeDataPrefetchers: Record<string, () => Promise<void>> = {
  '/greeting': () => import('../pages/Greeting/prefetch').then((m) => m.prefetch()),
}

// 하단 네비 목적지 — 사용자가 가장 먼저 누르는 곳이라 메뉴 페이지들보다 먼저 받아둔다
export const NAV_ROUTES = ['/bible', '/prayer-focus', '/profile']

// 비로그인 방문자가 랜딩에서 실제로 갈 수 있는 공개 페이지. 로그인 전용 페이지
// (소그룹·계정·프로필·기도·성장·정원·캡슐 등)는 첫 방문자 대다수가 쓰지 않고
// 이탈하므로 미리 받지 않는다 — Vercel 대역폭과 모바일 데이터 낭비를 막는다.
const PUBLIC_MENU_ROUTES = ['/about', '/greeting', '/visit', '/worship', '/education', '/sermon', '/events', '/news', '/bible']

// 알림 '바로가기'·푸시로 들어오는 딥링크 경로. :id가 붙어 메뉴 테이블에 못 넣는데,
// 라우터(v7)가 화면 전환을 startTransition으로 돌리기 때문에 청크가 도착할 때까지
// 이전 화면(홈)을 그대로 붙잡고 있는다 → 모바일에선 "홈에 갔다가 상세로" 두 번
// 이동한 것처럼 보인다. 링크가 화면에 뜨는 순간 미리 받아두면 탭 즉시 전환된다.
// (loaded/inflight 키는 경로가 아니라 아래 key — /capsule/1 과 /capsule/2 는 같은 청크)
const deepLinkRouteLoaders: { key: string; match: RegExp; load: RouteLoader }[] = [
  { key: 'capsule/new', match: /^\/capsule\/new$/, load: () => import('../pages/Capsule/CapsuleCreate') },
  { key: 'capsule/invite', match: /^\/capsule\/invite\//, load: () => import('../pages/Capsule/CapsuleInvite') },
  { key: 'capsule/detail', match: /^\/capsule\/[^/]+$/, load: () => import('../pages/Capsule/CapsuleOpen') },
  { key: 'capsule', match: /^\/capsule$/, load: () => import('../pages/Capsule/CapsuleList') },
  { key: 'classes/join', match: /^\/classes\/join\//, load: () => import('../pages/ClassRoom/JoinClass') },
  { key: 'classes/detail', match: /^\/classes\/[^/]+$/, load: () => import('../pages/ClassRoom/ClassHome') },
]

// 진행 중인 로드는 promise 자체를 캐싱한다. Set으로 "시작했음"만 기록하면
// 아직 안 끝난 로드에 await 해도 즉시 resolve돼서 청크 없이 이동하게 된다.
const inflight = new Map<string, Promise<void>>()
const loaded = new Set<string>()

/** 경로 → (캐시 키, 청크 로더). 쿼리·해시·끝 슬래시는 떼고 본다 */
const resolveLoader = (path: string): { key: string; load: RouteLoader } | null => {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/'

  const menu = menuRouteLoaders[clean]
  if (menu) return { key: clean, load: menu }

  const deep = deepLinkRouteLoaders.find((r) => r.match.test(clean))
  return deep ? { key: deep.key, load: deep.load } : null
}

// 이미 받아둔 청크인지 동기로 확인 — 스피너를 한 프레임도 깜빡이지 않게 하는 데 쓴다
export const isRoutePreloaded = (path: string): boolean => {
  const resolved = resolveLoader(path)
  return resolved ? loaded.has(resolved.key) : false
}

// 실패(오프라인 등) 시 캐시에서 제거해 다음 기회에 재시도할 수 있게 한다
export const preloadRoute = (path: string): Promise<void> => {
  const resolved = resolveLoader(path)
  if (!resolved) return Promise.resolve()

  const cached = inflight.get(resolved.key)
  if (cached) return cached

  const promise = resolved
    .load()
    .then(() => {
      loaded.add(resolved.key)
      // 데이터 선요청 실패는 청크 프리로드 성공과 무관하다 — 진입 시 훅이 다시 받는다
      void routeDataPrefetchers[resolved.key]?.().catch(() => undefined)
    })
    .catch(() => {
      inflight.delete(resolved.key)
    })
  inflight.set(resolved.key, promise)
  return promise
}

// 하단 네비 3개는 동시에 받는다 (순차로 돌리면 마지막 것이 몇 초씩 밀린다)
export const preloadNavRoutes = (): Promise<void> =>
  Promise.all(NAV_ROUTES.map(preloadRoute)).then(() => undefined)

// 메뉴가 열리는 순간 호출 — 네트워크를 몰아치지 않게 순차로 받는다
export const preloadMenuRoutes = async (): Promise<void> => {
  // 비로그인: 공개 페이지만 순차로 (로그인하면 HomeGate 가 다시 마운트되며 전체 프리로드)
  if (!localStorage.getItem('access_token')) {
    for (const path of PUBLIC_MENU_ROUTES) {
      await preloadRoute(path)
    }
    return
  }
  // 네비 목적지를 먼저 확보한 뒤 나머지 메뉴 페이지를 채운다
  await preloadNavRoutes()
  for (const path of Object.keys(menuRouteLoaders)) {
    await preloadRoute(path)
  }
}

// 로그인 직후 유휴 시간에 미리 받아둘 "다음에 갈 확률이 높은" 곳만 — 하단 네비 3개 +
// 홈에서 한 탭 거리인 화면. 25개 메뉴 청크(~1MB)를 통째로 받으면 홈 API 요청과
// 대역폭을 다투고 모바일 데이터를 태운다. 나머지는 메뉴를 여는 순간(preloadMenuRoutes)
// 이나 링크 호버/터치 때 받는다.
const IDLE_PRELOAD_ROUTES = [...NAV_ROUTES, '/events', '/news', '/groups', '/growth']

const preloadLikelyRoutes = async (): Promise<void> => {
  if (!localStorage.getItem('access_token')) {
    for (const path of PUBLIC_MENU_ROUTES) {
      await preloadRoute(path)
    }
    return
  }
  await preloadNavRoutes()
  for (const path of IDLE_PRELOAD_ROUTES) {
    await preloadRoute(path)
  }
}

// 첫 화면 렌더가 끝난 뒤 브라우저 유휴 시간에 미리 받아두기
export const schedulePreloadOnIdle = (): void => {
  const run = () => {
    void preloadLikelyRoutes()
  }
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 5000 })
  } else {
    setTimeout(run, 2500)
  }
}
