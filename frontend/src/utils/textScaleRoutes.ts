// PC 글씨 크기(utils/feedTextScale.ts)를 zoom 으로 받는 화면 — 어르신이 자주 "읽는" 화면과
// 잘못 누르면 곤란한 "참여" 화면(투표·설문·좌석·신청) 위주로 고른다.
// 넣지 않은 화면과 이유:
// - 홈 피드('/'·'/feed'): data-feed-scale 로 글씨만 키운다(3컬럼 레이아웃 보호)
// - 목회자(/pastor): 자체 글씨 크기 토글(pages/Pastor/components/textScale.ts)
// - 성경 본문: 절 이동·낭독 따라가기가 화면 좌표로 계산돼 zoom 대신 글자 크기 값에 --text-mul 을 곱한다
//   (hasTextScale 에는 넣어 헤더 '가'가 보인다). 집중 읽기·낭독 영화관은 자체 가−/가+
// - 지도·지구본·캔버스(/bible/atlas·/mission·/bible/photo-verse): 포인터 좌표 계산이 zoom 과 어긋난다
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
  '/prayer-focus',
  '/thanks',
  '/bible/plans',
  '/bible/meditation',
  // 참여
  '/events',
  '/elections',
  '/survey',
  '/seats',
  '/culture',
  '/education',
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

const matches = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`)

/** 이 화면은 <main data-app-scale> zoom 으로 글씨 크기를 받는다 */
export const zoomsWithTextScale = (pathname: string): boolean =>
  !EXCLUDED.some(r => matches(pathname, r)) && ZOOM_ROUTES.some(r => matches(pathname, r))

// 성경 본문 — /bible 허브는 책을 고르면 같은 주소에서 본문으로 바뀐다
const BIBLE_READER = /^\/bible(\/\d+\/\d+)?$/

/** 헤더 '가' 버튼을 보일 화면 — 눌러도 아무것도 안 바뀌는 화면에선 숨긴다 */
export const hasTextScale = (pathname: string, isLoggedIn: boolean): boolean =>
  zoomsWithTextScale(pathname) ||
  BIBLE_READER.test(pathname) ||
  pathname === '/feed' ||
  (pathname === '/' && isLoggedIn)
