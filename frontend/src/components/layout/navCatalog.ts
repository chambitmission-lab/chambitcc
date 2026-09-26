import type { Translation } from '../../locales'
import type { NavIconKey } from './NewHeader/components/NavIcons'

// 앱 메뉴 카탈로그 — 한 페이지의 "이름·설명·아이콘·경로"는 여기 한 곳에만 적는다.
// 헤더 드롭다운(DesktopNav)·PC 메가 메뉴/모바일 런처(NavigationMenu)·⌘K 팔레트(commandIndex)가
// 전부 이 표를 읽는다. 전엔 네 파일이 각자 목록을 들고 있어 같은 /mission 이 화면마다 다른 이름으로
// 뜨고, 팔레트엔 /education·/seats·/survey 가 빠져 있었다.
// 화면마다 "무엇을 어떤 순서로" 보일지는 각 화면이 경로 목록으로 고른다(navEntries) — 묶음과
// 순서는 화면 성격에 따라 달라도 되지만, 항목 자체는 여기서만 정의한다.

export type NavGroup = 'church' | 'word' | 'together' | 'faith'

export interface NavEntry {
  /** 경로(+쿼리) — '/news?tab=bulletin' 처럼 탭 딥링크 허용 */
  path: string
  labelKey: keyof Translation
  descKey: keyof Translation
  /** NAV_ICONS 키. null 이면 화면이 자체 폴백 아이콘을 그린다(주보·새가족 앨범) */
  icon: NavIconKey | null
  group: NavGroup
  /** 신앙 액티비티(게임·이벤트성) — 런처·메가 메뉴에서 아이콘을 브랜드 색으로 강조한다 */
  accent?: boolean
}

export const NAV_CATALOG: NavEntry[] = [
  // 교회 안내
  { path: '/about', labelKey: 'about', descKey: 'navDescAbout', icon: 'about', group: 'church' },
  { path: '/greeting', labelKey: 'greeting', descKey: 'navDescGreeting', icon: 'greeting', group: 'church' },
  { path: '/visit', labelKey: 'visit', descKey: 'navDescVisit', icon: 'visit', group: 'church' },
  { path: '/history', labelKey: 'history', descKey: 'navDescHistory', icon: 'history', group: 'church' },
  { path: '/people', labelKey: 'people', descKey: 'navDescPeople', icon: 'people', group: 'church' },
  { path: '/organization', labelKey: 'organization', descKey: 'navDescOrganization', icon: 'organization', group: 'church' },
  // 예배·말씀
  { path: '/worship', labelKey: 'worship', descKey: 'navDescWorship', icon: 'worship', group: 'word' },
  { path: '/education', labelKey: 'education', descKey: 'navDescEducation', icon: 'education', group: 'word' },
  { path: '/sermon', labelKey: 'sermon', descKey: 'navDescSermon', icon: 'sermon', group: 'word' },
  { path: '/bible', labelKey: 'bible', descKey: 'navDescBible', icon: 'bible', group: 'word' },
  { path: '/ministry', labelKey: 'ministry', descKey: 'navDescMinistry', icon: 'ministry', group: 'word' },
  { path: '/news?tab=bulletin', labelKey: 'bulletin', descKey: 'navDescBulletin', icon: null, group: 'word' },
  // 함께
  { path: '/events', labelKey: 'events', descKey: 'navDescEvents', icon: 'events', group: 'together' },
  { path: '/seats', labelKey: 'seats', descKey: 'navDescSeats', icon: 'seats', group: 'together' },
  { path: '/mission', labelKey: 'mission', descKey: 'navDescMission', icon: 'missionStatus', group: 'together' },
  { path: '/culture', labelKey: 'culture', descKey: 'navDescCulture', icon: 'culture', group: 'together' },
  { path: '/survey', labelKey: 'survey', descKey: 'navDescSurvey', icon: 'survey', group: 'together' },
  { path: '/news', labelKey: 'news', descKey: 'navDescNews', icon: 'news', group: 'together' },
  { path: '/news?tab=new-family', labelKey: 'navNewFamilyAlbum', descKey: 'navDescNewFamily', icon: null, group: 'together' },
  // 나의 신앙
  { path: '/groups', labelKey: 'myGroups', descKey: 'navDescMyGroups', icon: 'myGroups', group: 'faith' },
  { path: '/classes', labelKey: 'classNote', descKey: 'navDescClassNote', icon: 'classNote', group: 'faith' },
  { path: '/garden', labelKey: 'garden', descKey: 'navDescGarden', icon: 'garden', group: 'faith', accent: true },
  { path: '/bluemarble', labelKey: 'bluemarble', descKey: 'navDescBluemarble', icon: 'bluemarble', group: 'faith', accent: true },
  { path: '/answered-prayers', labelKey: 'answeredPrayers', descKey: 'navDescAnsweredPrayers', icon: 'answeredPrayers', group: 'faith', accent: true },
  { path: '/intercession', labelKey: 'intercession', descKey: 'navDescIntercession', icon: 'intercession', group: 'faith', accent: true },
]

const byPath = new Map(NAV_CATALOG.map((e) => [e.path, e]))

/** 경로 하나 → 카탈로그 항목. 없는 경로는 오타 — 개발 중엔 바로 알린다 */
export const navEntry = (path: string): NavEntry => {
  const entry = byPath.get(path)
  if (!entry) {
    if (import.meta.env.DEV) throw new Error(`navCatalog: 등록되지 않은 경로 ${path}`)
    // 프로덕션에선 빈 껍데기 대신 첫 항목처럼 죽지 않게 — 실제로는 DEV 에서 잡힌다
    return { path, labelKey: 'home', descKey: 'home', icon: null, group: 'church' }
  }
  return entry
}

/** 화면이 고른 순서대로 카탈로그 항목을 뽑는다 */
export const navEntries = (paths: string[]): NavEntry[] => paths.map(navEntry)

// 현재 위치가 이 항목과 일치하는지 — 쿼리 딥링크는 pathname+search 로, 일반 경로는 하위 경로까지
export const navEntryMatches = (entry: Pick<NavEntry, 'path'>, pathname: string, search: string): boolean => {
  if (entry.path.includes('?')) return `${pathname}${search}`.startsWith(entry.path)
  return pathname === entry.path || pathname.startsWith(`${entry.path}/`)
}
