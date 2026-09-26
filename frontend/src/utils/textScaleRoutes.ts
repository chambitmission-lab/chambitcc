// PC 글씨 크기(utils/feedTextScale.ts)가 화면에 적용되는 방식 — 라우트 지식은 이 파일 한 곳.
//   zoom : <main data-app-scale> 로 페이지 전체를 zoom — 어르신이 자주 "읽는" 화면과
//          잘못 누르면 곤란한 "참여" 화면(투표·설문·좌석·신청) 위주로 고른다.
//   text : 글자 크기 값에 --text-mul 만 곱한다 — 절 이동·낭독 따라가기가 화면 좌표로 계산되는 성경 본문.
//          집중 읽기·낭독 영화관은 자체 가−/가+
//   feed : data-feed-scale 로 글씨만 키운다 — 홈 피드는 3컬럼이라 카드 폭까지 커지면 레이아웃이 깨진다
//   null : 눌러도 아무것도 안 바뀌는 화면 — 헤더 '가' 버튼을 숨긴다
// zoom 에 넣지 않은 화면과 이유:
// - 목회자(/pastor): 자체 글씨 크기 토글(pages/Pastor/components/textScale.ts)
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
  '/prayer-focus', // 레일은 숨지만 헤더 '가'는 남긴다(NewHeader) — zoom 만 받고 조절이 안 되는 화면이 없게
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

/** 헤더 '가' 버튼을 보일 화면 — 눌러도 아무것도 안 바뀌는 화면에선 숨긴다 */
export const hasTextScale = (pathname: string, isLoggedIn: boolean): boolean =>
  textScaleMode(pathname, isLoggedIn) !== null
