import { useSyncExternalStore } from 'react'

// PC 글씨 크기(utils/feedTextScale.ts)가 화면에 적용되는 방식 — 라우트 지식은 이 파일 한 곳.
//   zoom : <main data-app-scale> 로 페이지 전체를 zoom — 어르신이 자주 "읽는" 화면과
//          잘못 누르면 곤란한 "참여" 화면(투표·설문·좌석·신청) 위주로 고른다.
//   text : 글자 크기 값에 --text-mul 만 곱한다 — 절 이동·낭독 따라가기가 화면 좌표로 계산되는 성경 본문.
//          집중 읽기·낭독 영화관은 자체 가−/가+
//          단, /bible 은 같은 주소에서 허브(책 목록·검색)와 본문이 갈린다 — 허브일 땐 BibleStudy 가
//          requestPageZoom(true) 로 zoom 을 빌려 쓴다(아래 페이지 요청)
//   feed : data-feed-scale 로 글씨만 키운다 — 홈 피드는 3컬럼이라 카드 폭까지 커지면 레이아웃이 깨진다
//   null : 눌러도 아무것도 안 바뀌는 화면 — 헤더 '가' 버튼을 숨긴다
// zoom 에 넣지 않은 화면과 이유:
// - 목회자(/pastor): 자체 글씨 크기 토글(pages/Pastor/components/textScale.ts)
// - 캔버스(/bible/photo-verse): 포인터 좌표 계산이 zoom 과 어긋난다
//   (/mission 은 넣었다 — 지구본 hitTest 만 화면 폭 ÷ 캔버스 폭으로 되돌렸다)
//   (/bible/atlas 는 넣었다 — 지도 캔버스가 화면 px 를 컨테이너 rect 비율로만 바꿔 zoom 과 무관하다.
//    PC 목록 판 높이·목록 따라가기 스크롤만 --az 로 나눴다)
//   (/ministry 는 넣었다 — 좌표를 쓰는 칼럼 편집기만 body 포털로 zoom 밖에 띄운다)
// - 자체 스크롤 좌표로 이동하는 화면(/history), 관리자 화면
// 새 화면을 넣을 땐 그 화면의 vh 높이·sticky top 을 var(--az) 로 나눠 두었는지 확인한다(common.css 주석).
const ZOOM_ROUTES = [
  // 읽기
  '/worship',
  '/sermon',
  '/ministry',
  '/news',
  '/prayer-topics',
  '/answered-prayers',
  '/intercession',
  '/prayer-focus', // 레일은 숨지만 헤더 '가'는 남긴다(NewHeader) — zoom 만 받고 조절이 안 되는 화면이 없게
  '/thanks',
  '/bible/plans',
  '/bible/meditation',
  '/bible/story', // 처음 만나는 성경 — 맵·에피소드 모두 (지도 카드는 클릭만 해 좌표 계산 없음)
  '/bible/wordbook',
  '/bible/genealogy', // 트리 스크롤은 컨테이너 안쪽 좌표끼리만 계산한다
  '/bible/atlas',
  // 참여
  '/events',
  '/elections',
  '/survey',
  '/seats',
  '/culture',
  '/education',
  '/mission',
  // 교회 안내
  '/about',
  '/greeting',
  '/visit',
  '/organization',
  '/people',
  '/online',
  '/tv',
  '/participate',
  // 개인·모임 (포인터 좌표 코드 없음 확인, vh·포털 시트는 --az/자체 zoom 으로 맞춤)
  '/profile',
  '/growth',
  '/garden',
  '/groups',
  '/rooms',
  '/classes',
  '/capsule',
]

// 대형 화면 송출용(이미 화면 크기에 맞춰 vw·vh 로 그린다)
const EXCLUDED = ['/prayer-topics/screen']

// 성경 본문 — /bible 허브는 책을 고르면 같은 주소에서 본문으로 바뀐다
const BIBLE_READER = /^\/bible(\/\d+\/\d+)?$/

const matches = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`)

export type TextScaleMode = 'zoom' | 'text' | 'feed'

/** 이 화면에 PC 글씨 크기가 어떻게 적용되는지 — 적용되지 않으면 null */
export const textScaleMode = (pathname: string, isLoggedIn: boolean): TextScaleMode | null => {
  if (EXCLUDED.some((r) => matches(pathname, r))) return null
  if (ZOOM_ROUTES.some((r) => matches(pathname, r))) return 'zoom'
  if (BIBLE_READER.test(pathname)) return 'text'
  if (pathname === '/feed' || (pathname === '/' && isLoggedIn)) return 'feed'
  return null
}

/** 이 화면은 <main data-app-scale> zoom 으로 글씨 크기를 받는다 */
export const zoomsWithTextScale = (pathname: string): boolean => textScaleMode(pathname, false) === 'zoom'

// ── 페이지 요청 zoom — 주소만으론 갈리지 않는 화면(/bible 허브 ↔ 본문)이 지금 상태로 zoom 을 켠다.
// 요청한 화면은 언마운트할 때 반드시 false 로 되돌린다(useEffect cleanup).
let pageZoom = false
const pageZoomListeners = new Set<() => void>()

export const requestPageZoom = (on: boolean) => {
  if (pageZoom === on) return
  pageZoom = on
  pageZoomListeners.forEach((l) => l())
}

export const usePageZoomRequest = (): boolean =>
  useSyncExternalStore(
    (cb) => {
      pageZoomListeners.add(cb)
      return () => {
        pageZoomListeners.delete(cb)
      }
    },
    () => pageZoom,
    () => false,
  )

/** 헤더 '가' 버튼을 보일 화면 — 눌러도 아무것도 안 바뀌는 화면에선 숨긴다 */
export const hasTextScale = (pathname: string, isLoggedIn: boolean): boolean =>
  textScaleMode(pathname, isLoggedIn) !== null
