import type { ComponentType } from 'react'
import { tokenStore } from './tokenStore'
import { preloadBudget, scheduleAfterFirstScreen } from './idlePreload'
import { warmRouteThemeAssets } from './themeAssets'
import { withChurchHistory } from '../api/churchHistory'
import { withMissionRoster } from '../api/missionRoster'
import { withRequestPriority } from '../api/utils/request'

type RouteLoader = () => Promise<{ default: ComponentType }>

// 발자취 시범 화면 — App.tsx lazy 와 딥링크 프리로드가 같은 로더를 쓴다
export const historyLabLoader: RouteLoader = withChurchHistory(() => import('../pages/History/labs/HistoryLab'))
// 설교 시범 화면(영상 히어로) — /sermon 상단 배너로만 들어온다
export const sermonLabLoader: RouteLoader = () => import('../pages/Sermon/SermonLab')

// 햄버거 메뉴에서 진입하는 lazy 페이지들의 동적 import를 한곳에 모음.
// App.tsx의 lazy()와 같은 함수를 공유해야 프리로드한 청크가 그대로 재사용된다.
export const menuRouteLoaders: Record<string, RouteLoader> = {
  '/about': () => import('../pages/About/About'),
  '/greeting': () => import('../pages/Greeting/Greeting'),
  '/visit': () => import('../pages/Visit/Visit'),
  '/organization': () => import('../pages/Organization/Organization'),
  '/people': () => import('../pages/People/People'),
  // 발자취 기록(백엔드 JSON)을 먼저 채우고 연다 — 화면 모듈이 로드 시점에 기록을 가공한다
  '/history': withChurchHistory(() => import('../pages/History/History')),
  '/worship': () => import('../pages/Worship/Worship'),
  '/education': () => import('../pages/Education/Education'),
  '/events': () => import('../pages/Events/EventCalendar'),
  '/culture': () => import('../pages/Culture/Culture'),
  '/sermon': () => import('../pages/Sermon/Sermon'),
  '/bible': () => import('../pages/Bible/BibleStudy'),
  '/ministry': () => import('../pages/Ministry/Ministry'),
  '/groups': () => import('../pages/Groups/MyGroups'),
  '/companion': () => import('../pages/Companion/CompanionList'),
  // 선교사 명단(섬기는 사람들 DB)을 먼저 채우고 연다 — 화면이 명단을 동기로 읽는다
  '/mission': withMissionRoster(() => import('../pages/Mission/Mission')),
  '/news': () => import('../pages/News/News'),
  '/garden': () =>
    import('../pages/Garden/Garden').then((m) => ({ default: m.Garden })),
  '/bluemarble': () => import('../pages/Bluemarble/Bluemarble'),
  // 나의 신앙 메뉴·성경 좌측 레일 "필사"
  '/bible/typing': () => import('../pages/Bible/Typing/TypingHome'),
  // 나의 신앙 메뉴·필사 허브 배너 "손글씨 필사대회"
  '/handwriting': () => import('../pages/HandwritingContest/ContestPage'),
  // 성경 하단 도크·좌측 레일 "플랜" — 라우트 lazy 와 같은 로더라 프리로드한 청크를 그대로 쓴다
  '/bible/plans': () => import('../pages/Bible/Plans/PlanList'),
  '/answered-prayers': () => import('../pages/Prayer/AnsweredPrayers'),
  '/intercession': () => import('../pages/Intercession/Intercession'),
  '/account': () => import('../pages/Account/AccountSettings'),
  '/profile': () => import('../pages/Profile/Profile'),
  '/prayer-focus': () => import('../pages/PrayerFocus'),
  // PC 좌측 레일 "신앙 여정"
  '/growth': () => import('../pages/Growth/Growth'),
  // 홈 히어로 '오늘의 교회' 봉투 목적지 — 봉투가 뜨는 순간 데운다
  '/today': () => import('../pages/TodayChurch/TodayChurch'),
  // 홈 FAB 스피드 다이얼의 "말씀 카드 만들기" 목적지
  '/bible/photo-verse': () => import('../pages/Bible/PhotoVerse/PhotoVerse'),
  // /bible 허브 도구 카드·홈 우측 레일 칩 목적지 — 허브가 뜨면 유휴 시간에 미리 받는다
  '/bible/situation': () => import('../pages/Bible/SituationBible'),
  '/classes': () => import('../pages/ClassRoom/ClassList'),
  '/survey': () => import('../pages/Survey/SurveyList'),
  '/seats': () => import('../pages/Seats/SeatEventList'),
  // 성경 하단 도크·좌측 레일 "단어장" — 테이블에 없어 누른 뒤에야 청크가 내려왔다
  '/bible/wordbook': () => import('../pages/Bible/Wordbook/WordbookPage'),
}

// 청크와 함께 데워 둘 페이지 데이터. 청크만 먼저 받으면 진입 시 껍데기(히어로)는 즉시
// 뜨는데 본문은 API 왕복만큼 늦게 따라와 "두 박자"로 그려진다 — 같은 타이밍에 응답과
// 첫 화면 이미지를 미리 받아 둔다. 청크가 처음 로드될 때 한 번만 호출된다.
// 테마별 히어로 삽화(CSS 배경)는 여기 적지 않는다 — themeAssets.ts 의 라우트 매니페스트가
// 청크 로드 직후 일괄로 데운다(현재 테마 즉시, 반대 테마는 유휴 시간에).
//
// 각 항목은 `run` 으로 실제 선요청 함수를 감싸 부른다 — 유휴 프리로드(preloadNavRoutes 등)는 run 이
// withRequestPriority('low') 라 그 안의 요청이 일반 대기열이 빈 뒤에야 나가고, 호버·터치(preloadRoute 기본)는
// 그대로 보통 요청이다. 2026-10-28 실측: 홈 콜드 마운트에서 프로필·신앙 여정 선요청(서버 1초짜리 집계 4~5개)이
// 알림·레일보다 앞줄에 서서 첫 화면을 1초 넘게 밀었다.
type Run = <T>(fn: () => T) => T
const routeDataPrefetchers: Record<string, (run: Run) => Promise<void>> = {
  '/greeting': (run) => import('../pages/Greeting/prefetch').then((m) => run(() => m.prefetch())),
  // 하단 네비 1순위 목적지 — 책 목록(+로그인 시 진행률·이어읽기)을 청크와 같이 데운다
  '/bible': (run) => import('../pages/Bible/prefetch').then((m) => run(() => m.prefetchBibleHub())),
  // 하단 네비 목적지 — 캐시가 아예 없을 때만(coldOnly) 받아 둔다. 무거운 집계 API 라
  // 앱을 켤 때마다 부르진 않고, 재로그인·배포 직후 같은 콜드 진입의 전체 로딩만 없앤다
  '/profile': (run) =>
    import('../pages/Profile/prefetch').then((m) => run(() => m.prefetchProfile(undefined, true))),
  // 교육과 훈련 트리(공개, 8KB gzip) — 청크·히어로는 미리 받는데 트리가 빠져 있어 진입 시
  // 히어로 → 스켈레톤 → 본문의 두 박자가 남았다. 같이 쓰는 useAboutContent 는 로컬
  // placeholder 캐시가 있어 화면을 막지 않는다.
  '/education': (run) =>
    Promise.all([import('../hooks/useEducation'), import('../config/queryClient')]).then(
      ([m, q]) => run(() => m.prefetchEducationTree(q.queryClient)),
    ),
  // 카테고리 목록 + 오늘의 위로 말씀 구절 — 청크만 받아 두면 진입 시 API 두 왕복이 직렬로 남는다
  // 칭호 도감 — 프로필 칭호 필·메뉴 목적지. GET /titles 는 평가까지 도는 무거운 요청이라 coldOnly
  '/garden': (run) =>
    Promise.all([import('../hooks/useTitles'), import('../config/queryClient'), import('./auth')]).then(
      ([m, q, a]) => {
        if (a.isAuthenticated()) run(() => m.prefetchTitles(q.queryClient, true))
      },
    ),
  // 바이블 퀘스트 — 화면 전체가 /state 응답을 기다리므로 청크와 나란히 상태·칸·토끼를 띄운다
  '/bluemarble': (run) =>
    Promise.all([import('../hooks/useBluemarble'), import('../config/queryClient'), import('./auth')]).then(
      ([m, q, a]) => {
        if (a.isAuthenticated()) run(() => m.prefetchQuest(q.queryClient))
      },
    ),
  // 주간 스토리 — 프로필 스토리 카드 목적지 (키는 deepLinkRouteLoaders 의 key)
  'weekly-story': (run) =>
    Promise.all([import('../hooks/useWeeklyStory'), import('../config/queryClient'), import('./auth')]).then(
      ([m, q, a]) => {
        if (a.isAuthenticated()) run(() => m.prefetchWeeklyStory(q.queryClient, true))
      },
    ),
  // 신앙 여정 — 프로필 여정 카드·PC 레일 목적지. 캐시가 없을 때만(coldOnly)
  '/growth': (run) =>
    Promise.all([import('../hooks/useGrowth'), import('../config/queryClient'), import('./auth')]).then(
      ([m, q, a]) => {
        if (a.isAuthenticated()) run(() => m.prefetchGrowth(q.queryClient, true))
      },
    ),
  // 오늘의 교회 — 데이터는 홈 묶음이 이미 심었다. 남는 건 손글씨(Nanum Pen) 서체: 한글 웹폰트는
  // unicode-range 조각이라 스타일시트만 붙여선 안 받고, 글자가 그려진 뒤에야 조각을 받아 진입 시
  // 폴백 서체 → 손글씨로 한 박자 늦게 바뀌었다. 기록 글자로 조각까지 미리 받아 둔다.
  '/today': (run) =>
    Promise.all([import('../pages/TodayChurch/memoryCopy'), import('../config/queryClient')]).then(
      ([m, q]) => run(() => m.warmMemoryFonts(q.queryClient)),
    ),
  '/bible/situation': (run) =>
    Promise.all([import('../hooks/useSituation'), import('../config/queryClient')]).then(
      ([m, q]) => run(() => m.prefetchSituation(q.queryClient)),
    ),
  // 말씀 필사 허브 — 메뉴 호버·성경 허브 타일 pointerdown 때 묶음을 청크와 같이. 캐시가 아예 없을 때만(coldOnly)
  '/bible/typing': (run) =>
    Promise.all([import('../hooks/useBibleTyping'), import('../config/queryClient')]).then(
      ([m, q]) => run(() => m.prefetchTypingHome(q.queryClient, true)),
    ),
  // 읽기 플랜 — 목록·오늘의 읽기 묶음. 캐시가 아예 없을 때만(coldOnly)
  '/bible/plans': (run) =>
    Promise.all([import('../hooks/useBiblePlan'), import('../config/queryClient')]).then(
      ([m, q]) => run(() => m.prefetchPlanOverview(q.queryClient, true)),
    ),
  // 손글씨 필사대회 — 목록 + 첫 대회 상세(공개 API). 캐시가 아예 없을 때만(coldOnly)
  '/handwriting': (run) =>
    Promise.all([import('../hooks/useHandwritingContest'), import('../config/queryClient')]).then(
      ([m, q]) => run(() => m.prefetchContestPage(q.queryClient, true)),
    ),
  // 내 단어장 — 첫 페이지(30개, 구절 본문 포함)를 청크와 같이. 로그인 전엔 훅도 꺼져 있어 받지 않는다
  '/bible/wordbook': (run) =>
    Promise.all([import('../hooks/useBibleWordNote'), import('../config/queryClient')]).then(
      ([m, q]) => run(() => m.prefetchWordbook(q.queryClient, true)),
    ),
  // 좌석 예약 — 행사 목록(공개 API, 로그인 시 내 좌석 포함)을 청크와 같이. 캐시가 없을 때만
  '/seats': (run) =>
    Promise.all([import('../hooks/useSeatEvents'), import('../config/queryClient')]).then(
      ([m, q]) => run(() => m.prefetchSeatEvents(q.queryClient, true)),
    ),
  // 설교 — 목록 첫 페이지 + 최신 설교 인용절. 청크만 받아 두면 진입 시 목록 → 인용절 두 왕복이 직렬로 남았다
  '/sermon': (run) => import('../pages/Sermon/prefetch').then((m) => run(() => m.prefetchSermonPage())),
  // 시범 화면도 같은 목록·인용절을 쓴다 (키는 deepLinkRouteLoaders 의 key)
  'sermon/new': (run) => import('../pages/Sermon/prefetch').then((m) => run(() => m.prefetchSermonPage())),
}

const runNow: Run = (fn) => fn()
const runLow: Run = (fn) => withRequestPriority('low', fn)

export interface PreloadRouteOptions {
  /** 유휴 프리로드 — 데이터 선요청을 'low' 로 보낸다(화면 요청이 다 나간 뒤 조용해져야 출발). 호버·터치는 false */
  idle?: boolean
}

// 하단 네비 목적지 — 사용자가 가장 먼저 누르는 곳이라 메뉴 페이지들보다 먼저 받아둔다
export const NAV_ROUTES = ['/bible', '/prayer-focus', '/profile']

// 비로그인 방문자가 랜딩에서 실제로 갈 수 있는 공개 페이지. 로그인 전용 페이지
// (소그룹·계정·프로필·기도·성장·정원·캡슐 등)는 첫 방문자 대다수가 쓰지 않고
// 이탈하므로 미리 받지 않는다 — Vercel 대역폭과 모바일 데이터 낭비를 막는다.
const PUBLIC_MENU_ROUTES = ['/about', '/greeting', '/visit', '/people', '/worship', '/education', '/sermon', '/events', '/news', '/bible']

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
  // 프로필 스토리 카드 목적지 — 메뉴 테이블에 없어 청크 프리로드 대상이 아니었다
  { key: 'weekly-story', match: /^\/weekly-story$/, load: () => import('../pages/WeeklyStory/WeeklyStory') },
  // 발자취 시범 화면 — 기존 /history 상단 배너로만 들어오므로 메뉴 프리로드에 넣지 않는다
  { key: 'history/new', match: /^\/history\/new$/, load: historyLabLoader },
  { key: 'sermon/new', match: /^\/sermon\/new$/, load: sermonLabLoader },
  { key: 'survey/detail', match: /^\/survey\/[^/]+$/, load: () => import('../pages/Survey/SurveyDetail') },
  { key: 'seats/detail', match: /^\/seats\/[^/]+$/, load: () => import('../pages/Seats/SeatEventDetail') },
  // 선거는 메뉴에 없다(선거인에게만 열림) — 홈 배너·링크로만 들어오므로 메뉴 프리로드에 넣지 않는다
  { key: 'elections', match: /^\/elections$/, load: () => import('../pages/Election/ElectionList') },
  { key: 'elections/detail', match: /^\/elections\/[^/]+$/, load: () => import('../pages/Election/ElectionDetail') },
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
export const preloadRoute = (path: string, options: PreloadRouteOptions = {}): Promise<void> => {
  const resolved = resolveLoader(path)
  if (!resolved) return Promise.resolve()
  const run = options.idle ? runLow : runNow

  const cached = inflight.get(resolved.key)
  if (cached) {
    // 청크는 한 번 받으면 끝이지만 데이터는 아니다 — 같은 탭에서 다시 로그인하면 캐시가 통째로
    // 비워지는데(queryClient.clear), 여기서 그냥 돌아가면 선요청이 영영 다시 돌지 않는다.
    // 선요청은 전부 staleTime 가드가 있어 캐시가 신선하면 요청 없이 끝난다.
    if (loaded.has(resolved.key)) void routeDataPrefetchers[resolved.key]?.(run).catch(() => undefined)
    return cached
  }

  const promise = resolved
    .load()
    .then(() => {
      loaded.add(resolved.key)
      // 데이터 선요청 실패는 청크 프리로드 성공과 무관하다 — 진입 시 훅이 다시 받는다
      void routeDataPrefetchers[resolved.key]?.(run).catch(() => undefined)
      // 히어로 삽화는 CSS 배경이라 청크를 받아 둬도 화면이 그려진 뒤에야 요청이 나간다 —
      // 청크와 같은 시점에 현재 테마 파일을 데운다. 3G 이하 예산에선 청크만 받는다.
      if (preloadBudget() === 'full') void warmRouteThemeAssets(path).catch(() => undefined)
    })
    .catch(() => {
      inflight.delete(resolved.key)
    })
  inflight.set(resolved.key, promise)
  return promise
}

// /capsule "새 캡슐 봉인하기" 버튼(목록 히어로·PC 레일) — 호버·누르는 순간 청크와 1단계 삽화(매니페스트)를 같이.
// 유휴 프리로드가 이미 받았으면 즉시 돌아온다
export const warmCapsuleCreate = (): void => {
  void preloadRoute('/capsule/new')
}

// 하단 네비 3개는 동시에 받는다 (순차로 돌리면 마지막 것이 몇 초씩 밀린다).
// 첫 화면 리소스(히어로·아이콘 폰트·홈 API)와 대역폭을 다투지 않게 `load` 뒤에 시작하되,
// 콜드 스타트 직후 누른 첫 탭이 먹히도록 settle 여유는 두지 않는다.
export const preloadNavRoutes = (): Promise<void> => {
  if (preloadBudget() === 'none') return Promise.resolve()
  return new Promise((resolve) => {
    scheduleAfterFirstScreen(
      () => void Promise.all(NAV_ROUTES.map((path) => preloadRoute(path, { idle: true }))).then(() => resolve()),
      { settleMs: 0, idleTimeoutMs: 1500 },
    )
  })
}

// 메뉴가 열리는 순간·헤더 메뉴에 마우스가 올라온 순간 호출 — 네트워크를 몰아치지 않게 순차로 받는다.
// 청크를 전부 받은 뒤엔 즉시 돌아온다: 안 그러면 헤더 위를 지나갈 때마다 36개를 다시 훑으며
// preloadRoute 가 staleTime 지난 데이터 선요청(/bible·/greeting·/bible/situation)을 재발사했다.
// 특정 화면의 데이터를 데우는 건 그 항목을 호버할 때 preloadRoute(path) 하나만 한다.
let menuChunksWarm = false
export const preloadMenuRoutes = async (): Promise<void> => {
  if (menuChunksWarm) return
  // 비로그인: 공개 페이지만 순차로 (로그인하면 HomeGate 가 다시 마운트되며 전체 프리로드)
  if (!tokenStore.getAccess()) {
    for (const path of PUBLIC_MENU_ROUTES) {
      await preloadRoute(path, { idle: true })
    }
    return
  }
  // 네비 목적지를 먼저 확보한 뒤 나머지 메뉴 페이지를 채운다
  await preloadNavRoutes()
  const all = [...NAV_ROUTES, ...Object.keys(menuRouteLoaders)]
  for (const path of all) {
    await preloadRoute(path, { idle: true })
  }
  // 실패(오프라인)한 청크가 있으면 다음 기회에 다시 돈다
  menuChunksWarm = all.every((path) => loaded.has(path))
}

// 로그인 직후 유휴 시간에 미리 받아둘 "다음에 갈 확률이 높은" 곳만 — 하단 네비 3개 +
// 홈에서 한 탭 거리인 화면. 25개 메뉴 청크(~1MB)를 통째로 받으면 홈 API 요청과
// 대역폭을 다투고 모바일 데이터를 태운다. 나머지는 메뉴를 여는 순간(preloadMenuRoutes)
// 이나 링크 호버/터치 때 받는다.
const IDLE_PRELOAD_ROUTES = [...NAV_ROUTES, '/sermon', '/events', '/news', '/groups', '/growth']

// 비로그인 방문자가 랜딩에서 실제로 누르는 곳만 — 공개 메뉴 9개(성경 청크만 gz 120KB 등
// 합계 JS 1.5MB)를 첫 방문마다 받는 건 랜딩 히어로·API 와 대역폭을 다투는 낭비였다.
// 나머지 공개 페이지는 메뉴를 여는 순간(preloadMenuRoutes) 받는다.
const GUEST_IDLE_ROUTES = ['/about', '/worship', '/sermon', '/visit', '/bible']

const preloadLikelyRoutes = async (): Promise<void> => {
  const budget = preloadBudget()
  if (budget === 'none') return

  if (!tokenStore.getAccess()) {
    for (const path of budget === 'essential' ? ['/about'] : GUEST_IDLE_ROUTES) {
      await preloadRoute(path, { idle: true })
    }
    return
  }
  await preloadNavRoutes()
  if (budget === 'essential') return
  for (const path of IDLE_PRELOAD_ROUTES) {
    await preloadRoute(path, { idle: true })
  }
}

// 첫 화면이 완전히 그려진 뒤(load + 여유 시간) 브라우저 유휴 시간에 미리 받아두기.
// 예전엔 requestIdleCallback 이 첫 페인트 직후(≈300ms)에 불려 LCP 이미지·아이콘 폰트와
// 다퉜다 — dynamic import() 는 High 우선순위라 "유휴"여도 대역폭은 양보하지 않는다.
export const schedulePreloadOnIdle = (): void => {
  scheduleAfterFirstScreen(() => void preloadLikelyRoutes())
}
