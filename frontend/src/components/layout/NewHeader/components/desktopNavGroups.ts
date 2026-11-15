import type { Translation } from '../../../../locales'
import { navEntries, navEntry, navEntryMatches, type NavEntry } from '../../navCatalog'

// PC 헤더 메뉴의 "축·순서·윗줄 버튼 모양" — DesktopNav(lazy 청크)와 그 자리 잡이
// DesktopNavFallback(엔트리 청크)이 함께 읽는다. 둘이 같은 클래스로 그려야 청크가 도착해
// 바뀌는 순간 폭이 1px 도 달라지지 않는다(옆의 검색창이 밀리지 않는다).
// 여기에 framer-motion 같은 무거운 의존성을 들이지 말 것 — 엔트리 청크에 딸려 온다.

export type NavTopGroup = {
  id: string
  labelKey: keyof Translation
  items: NavEntry[]
}

// 항목의 이름·설명·아이콘은 layout/navCatalog.ts 한 곳 — 여기선 축과 순서만 고른다
export const NAV_TOP_GROUPS: NavTopGroup[] = [
  {
    id: 'church',
    labelKey: 'navTopChurch',
    items: navEntries(['/about', '/greeting', '/visit', '/history', '/people', '/organization']),
  },
  {
    id: 'word',
    labelKey: 'navTopWord',
    items: navEntries(['/worship', '/education', '/sermon', '/ministry', '/news?tab=bulletin']),
  },
  {
    id: 'together',
    labelKey: 'navTopTogether',
    items: navEntries(['/events', '/seats', '/mission', '/culture', '/survey', '/news?tab=new-family']),
  },
]

// 소식 — 클릭은 /news 로 바로 이동, 호버는 미리보기 메가 패널(NewsMegaPanel)
export const NAV_TOP_NEWS = navEntry('/news')

/** 현재 페이지가 속한 축 (뉴스 탭 딥링크는 해당 축으로 귀속, 단순 /news 는 소식) */
export const activeNavTopGroupId = (pathname: string, search: string): string | null =>
  NAV_TOP_GROUPS.find((g) => g.items.some((it) => navEntryMatches(it, pathname, search)))?.id ??
  (navEntryMatches(NAV_TOP_NEWS, pathname, search) ? 'news' : null)

// 내비 라벨은 전부 semibold 이상 — medium 회색은 "그냥 놓인 글자"로 읽힌다 (토스 문법)
export const navTopClass = (active: boolean, isOpen: boolean): string =>
  `relative flex items-center gap-1 h-10 px-3.5 rounded-full text-[length:calc(16px*var(--hn,1))] whitespace-nowrap transition-colors duration-150 ${
    active
      ? 'text-brand font-bold'
      : isOpen
        ? 'text-ink-strong font-semibold bg-black/[0.04] dark:bg-white/[0.06]'
        : 'text-gray-600 dark:text-white/70 font-semibold hover:text-ink-strong hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
  }`

/** 활성 축 알약의 모양 — DesktopNav 는 여기에 layoutId 를 얹어 축 사이를 미끄러뜨린다 */
export const NAV_TOP_PILL_CLASS = 'absolute inset-0 rounded-full bg-[var(--brand-soft-strong)]'

/** nav 루트 — 글씨 배율(--hn·--hd)이 이 클래스에 걸려 있다(NewHeader.css) */
export const NAV_TOP_ROOT_CLASS = 'desktop-nav relative hidden lg:flex items-center gap-0.5'
