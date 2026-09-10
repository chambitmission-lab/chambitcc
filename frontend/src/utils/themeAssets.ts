// 테마별(라이트/다크) 배경 이미지 매니페스트 + 선요청 유틸 — 앱 전체의 단일 출처.
//
// 문제: 히어로·카드 삽화는 CSS background-image 로 깔리고 테마마다 다른 파일을 쓴다
// (.hero / .dark .hero). CSS 배경은 두 겹으로 늦게 발견된다 — HTML preload 스캐너가 URL 을
// 볼 수 없고(라우트 청크의 CSS 안에 있다), 매칭되는 엘리먼트가 실제로 렌더될 때까지
// 요청조차 나가지 않는다. 게다가 브라우저는 "지금 매칭되는" 한 장만 받으므로, 테마를
// 토글하는 순간 반대 테마 파일을 맨땅에서 받기 시작해 크로스페이드가 끝난 뒤에도
// 그라데이션만 남았다가 이미지가 한 박자 늦게 뜬다.
//
// 처방(세 시점):
//   1. 청크 프리로드 시점(routePreload) — 현재 테마 파일을 청크와 같이 받아 진입 즉시 보이게
//   2. 화면 진입·마운트 시점(useThemeArt / warmRouteThemeAssets) — 현재 테마를 먼저,
//      반대 테마를 첫 화면이 끝난 유휴 시간에 받아 둔다(절약 모드·2G 는 반대 테마 생략)
//   3. 토글 직전(ThemeContext) — 지금 화면의 반대 테마 파일을 높은 우선순위로 요청하고
//      아주 짧게 기다린 뒤 전환해, 크로스페이드 안에 이미지가 함께 실리게 한다
//      (PC 는 토글 버튼 hover/focus 에서 한 번 더 앞당긴다).
//
// 새 화면에 테마별 배경을 추가하면: (a) 아래에 ThemePair 를 선언하고 (b) ROUTE_ASSETS 에
// 라우트를 등록한다. 조건부로만 뜨는 카드(피드 카드 등)는 매니페스트 대신 컴포넌트에서
// useThemeArt(pair) 로 마운트 동안 등록한다 — 안 뜨는 사람에게 파일을 물리지 않기 위해.
//
// src/assets 의 파일은 번들러를 거쳐 해시 URL 이 된다(그림을 다시 구우면 URL 이 바뀌어
// 서비스 워커의 옛 캐시를 자연히 비켜 간다). public/ 파일은 URL 이 고정이라 sw.js 의
// stale-while-revalidate 가 백그라운드로 갱신한다. 어느 쪽이든 CSS 와 같은 경로여야 한다.
import { preloadBudget } from './idlePreload'
import { getNaturalSeason, type NaturalSeason } from './naturalSeason'
import alarmHeroLight from '../assets/verse-alarm/hero-light.webp'
import alarmHeroDark from '../assets/verse-alarm/hero-dark.webp'
import alarmBandLight from '../assets/verse-alarm/mobile-band-light.webp'
import alarmBandDark from '../assets/verse-alarm/mobile-band-dark.webp'
import heroSpringDay from '../assets/hero/spring-afternoon.webp'
import heroSummerDay from '../assets/hero/afternoon.webp'
import heroAutumnDay from '../assets/hero/autumn-afternoon.webp'
import heroWinterDay from '../assets/hero/winter-afternoon.webp'
import heroWinterEvening from '../assets/hero/winter-evening.webp'

export type ThemeName = 'light' | 'dark'

export interface ThemePair {
  light: string
  dark: string
  /** 화면 폭 등 조건 — false 를 돌려주면 이 쌍은 지금 쓰이지 않는 것으로 본다 */
  when?: () => boolean
}

// ── 테마 판정 ────────────────────────────────────────────────
// index.html 의 테마 선적용 스크립트 / ThemeContext 가 붙이는 .dark 를 따른다
export const currentTheme = (): ThemeName =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'

export const oppositeTheme = (t: ThemeName): ThemeName => (t === 'dark' ? 'light' : 'dark')

export const pairSrc = (pair: ThemePair, theme: ThemeName): string => (theme === 'dark' ? pair.dark : pair.light)

// ── 쌍 선언 ──────────────────────────────────────────────────
/** /bible/plans 히어로 (plan-hero.css) — index.html 의 딥링크 preload 와 경로 동일 유지 */
export const PLAN_HERO: ThemePair = { light: '/images/plans/hero-light.webp', dark: '/images/plans/hero-dark.webp' }
/** /rooms 히어로 (rooms-hero.css) */
export const ROOMS_HERO: ThemePair = { light: '/images/rooms/hero-light.webp', dark: '/images/rooms/hero-dark.webp' }
/** /survey 히어로 (survey-hero.css) */
export const SURVEY_HERO: ThemePair = { light: '/images/survey/hero-light.webp', dark: '/images/survey/hero-dark.webp' }
/** /garden 성경 칭호 히어로 배너 (theme.css --garden-hero-image) */
export const GARDEN_HERO: ThemePair = {
  light: '/images/garden/bible-title-hero-light.webp',
  dark: '/images/garden/bible-title-hero.webp',
}
/** /capsule 히어로 (capsule.css) */
export const CAPSULE_HERO: ThemePair = { light: '/images/capsule/hero-light.webp', dark: '/images/capsule/hero-dark.webp' }
/** 개봉 후 편지 화면의 하늘 (capsule.css) */
export const CAPSULE_LETTER: ThemePair = {
  light: '/images/capsule/letter-light.webp',
  dark: '/images/capsule/letter-dark.webp',
}
/** 봉인 대기 화면의 금고 (capsule.css --vault-art) */
export const CAPSULE_SEALED: ThemePair = {
  light: '/images/capsule/sealed-light.webp',
  dark: '/images/capsule/sealed-dark.webp',
}
/** 홈 타임캡슐 배너 (TimeCapsuleCard.css) */
export const CAPSULE_HOME_BANNER: ThemePair = {
  light: '/images/capsule/home-banner-light.webp',
  dark: '/images/capsule/home-banner-dark.webp',
}
/** 홈 "지금 함께 읽는 중" 카드 (LiveReadingCard.css) — 조건부 노출, 컴포넌트가 등록 */
export const LIVE_READING_CARD: ThemePair = {
  light: '/images/home/live-reading-light.webp',
  dark: '/images/home/live-reading-dark.webp',
}
/** 홈 공지 배너 마스코트 (HomeNotice.tsx 인라인 스타일) */
export const NOTICE_BANNER: ThemePair = { light: '/images/notice/banner-light.webp', dark: '/images/notice/banner-dark.webp' }
/** /bible 통독표 히어로 (book-selector.css) — 테마 쌍 중 가장 큰 파일(71~92KB) */
export const READING_HERO: ThemePair = {
  light: '/images/bible/reading-hero-light.webp',
  dark: '/images/bible/reading-hero-dark.webp',
}
/** /bible 이어읽기 카드 (dashboard.css .dash-card--resume) */
export const RESUME_CARD: ThemePair = { light: '/images/bible/resume-light.webp', dark: '/images/bible/resume-dark.webp' }
/** 오디오 플레이어 능선 띠 (audio-player.css) — 플레이어가 열릴 때만, 컴포넌트가 등록 */
export const AUDIO_RIDGE: ThemePair = {
  light: '/images/bible/audio-ridge-light.webp',
  dark: '/images/bible/audio-ridge-dark.webp',
}
/** /bible/genealogy 히어로 (theme.css --genealogy-hero-image) */
export const GENEALOGY_HERO: ThemePair = {
  light: '/images/genealogy/tree-hero-light.webp',
  dark: '/images/genealogy/tree-hero-dark.webp',
}
/** /bible/photo-verse 인트로 (PhotoVerse.css) */
export const PHOTO_VERSE_INTRO: ThemePair = {
  light: '/images/photo-verse/intro-light.webp',
  dark: '/images/photo-verse/intro-dark.webp',
}
/** /worship 히어로 (theme.css --worship-hero-art) */
export const WORSHIP_HERO: ThemePair = { light: '/images/worship/hero-light.webp', dark: '/images/worship/hero-dark.webp' }
/** /education 히어로 (education.css --edu-hero-art) */
export const EDUCATION_HERO: ThemePair = {
  light: '/images/education/hero-light.webp',
  dark: '/images/education/hero-dark.webp',
}
/** /groups/:id 히어로 (groupDetail.css) */
export const GROUP_DETAIL_HERO: ThemePair = { light: '/images/groups/hero-light.webp', dark: '/images/groups/hero-dark.webp' }
/** /culture 히어로 (culture-hero.css) */
export const CULTURE_HERO: ThemePair = { light: '/images/culture/hero-light.webp', dark: '/images/culture/hero-dark.webp' }
/** /news 탭별 히어로 (news-hero.css) — 활성 탭은 News 가 등록, 매니페스트엔 기본 탭만 */
export const NEWS_HERO: Record<'news' | 'new-family' | 'event-album', ThemePair> = {
  news: { light: '/images/news/church-news-light.webp', dark: '/images/news/church-news-dark.webp' },
  'new-family': { light: '/images/news/new-family-light.webp', dark: '/images/news/new-family-dark.webp' },
  'event-album': { light: '/images/news/event-album-light.webp', dark: '/images/news/event-album-dark.webp' },
}
/** /news 헌금 탭 히어로 (offering.css) */
export const OFFERING_HERO: ThemePair = { light: '/images/offering/hero-light.webp', dark: '/images/offering/hero-dark.webp' }
/** /visit 히어로 사진 — Visit.tsx 가 인라인 style 로 고른다(라이트=낮, 다크=밤) */
export const VISIT_HERO: ThemePair = { light: '/images/visit/church-day.webp', dark: '/images/visit/church-night.webp' }

/** 장면 한 장을 통째로 까는 폭인가 — VerseAlarmPage.css 의 @media (min-width: 1440px) 와 짝 */
const alarmWideScene = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1440px)').matches
/** /bible/alarm 다이얼 카드 배경 — ≥1440px 원본 장면 */
export const ALARM_HERO: ThemePair = { light: alarmHeroLight, dark: alarmHeroDark, when: alarmWideScene }
/** /bible/alarm 다이얼 카드 배경 — 그 아래 폭의 모바일 띠 */
export const ALARM_BAND: ThemePair = { light: alarmBandLight, dark: alarmBandDark, when: () => !alarmWideScene() }
/** 지금 폭에서 쓰는 알람 카드 배경 */
export const alarmArtPair = (): ThemePair => (alarmWideScene() ? ALARM_HERO : ALARM_BAND)

/** /greeting 라이트 히어로 — 계절 낮 사진(홈 히어로와 같은 자산). Greeting.tsx 가 인라인 변수로 넘긴다 */
export const GREETING_HERO_DAY_BY_SEASON: Record<NaturalSeason, string> = {
  spring: heroSpringDay,
  summer: heroSummerDay,
  autumn: heroAutumnDay,
  winter: heroWinterDay,
}
/** /greeting 히어로 — 다크는 계절 무관 겨울 밤 은하수 고정(theme.css [data-theme="dark"] .gr-hero-card) */
export const GREETING_HERO: ThemePair = {
  get light() {
    return GREETING_HERO_DAY_BY_SEASON[getNaturalSeason(new Date())]
  },
  dark: heroWinterEvening,
}

// ── 라우트 매니페스트 ─────────────────────────────────────────
// 경로는 HashRouter 의 '#' 뒤 pathname(쿼리 제외). 첫 화면에 "항상" 뜨는 배경만 적는다.
interface RouteAssets {
  match: RegExp
  pairs: ThemePair[]
}

// 홈('/')은 적지 않는다 — 비로그인 랜딩엔 카드가 없고, 로그인 홈의 배너·카드는 조건부라
// 각 컴포넌트(TimeCapsuleCard·HomeNotice·LiveReadingCard)가 뜰 때 useThemeArt 로 등록한다.
const ROUTE_ASSETS: RouteAssets[] = [
  { match: /^\/greeting$/, pairs: [GREETING_HERO] },
  { match: /^\/visit$/, pairs: [VISIT_HERO] },
  { match: /^\/worship$/, pairs: [WORSHIP_HERO] },
  { match: /^\/education$/, pairs: [EDUCATION_HERO] },
  { match: /^\/culture$/, pairs: [CULTURE_HERO] },
  { match: /^\/news$/, pairs: [NEWS_HERO.news] },
  { match: /^\/survey$/, pairs: [SURVEY_HERO] },
  { match: /^\/garden$/, pairs: [GARDEN_HERO] },
  { match: /^\/rooms$/, pairs: [ROOMS_HERO] },
  { match: /^\/capsule$/, pairs: [CAPSULE_HERO] },
  { match: /^\/groups\/(?!join\/)[^/]+$/, pairs: [GROUP_DETAIL_HERO] },
  { match: /^\/bible$/, pairs: [READING_HERO, RESUME_CARD] },
  { match: /^\/bible\/plans$/, pairs: [PLAN_HERO] },
  { match: /^\/bible\/genealogy$/, pairs: [GENEALOGY_HERO] },
  { match: /^\/bible\/photo-verse$/, pairs: [PHOTO_VERSE_INTRO] },
  { match: /^\/bible\/alarm$/, pairs: [ALARM_HERO, ALARM_BAND] },
]

const cleanPath = (path: string): string => path.split(/[?#]/)[0].replace(/\/+$/, '') || '/'

/** HashRouter 기준 현재 경로 — React 밖(컨텍스트·유틸)에서 라우트를 알아야 할 때 */
export const currentRoutePath = (): string =>
  typeof window === 'undefined' ? '/' : cleanPath(window.location.hash.replace(/^#/, '') || '/')

/** 매니페스트에서 이 경로의 첫 화면 배경 쌍(조건 미충족 제외) */
export const manifestPairsFor = (path: string): ThemePair[] => {
  const clean = cleanPath(path)
  return ROUTE_ASSETS.filter((r) => r.match.test(clean))
    .flatMap((r) => r.pairs)
    .filter((p) => !p.when || p.when())
}

// ── 화면에 실제로 떠 있는 쌍(컴포넌트 등록) ──────────────────
// 조건부 카드·탭·플레이어처럼 매니페스트로 미리 알 수 없는 배경은 마운트 동안 등록한다.
// 토글 직전 선요청은 "매니페스트 ∪ 등록" 을 본다.
const registered = new Map<ThemePair, number>()

export const registerThemePair = (pair: ThemePair): (() => void) => {
  registered.set(pair, (registered.get(pair) ?? 0) + 1)
  return () => {
    const n = (registered.get(pair) ?? 1) - 1
    if (n <= 0) registered.delete(pair)
    else registered.set(pair, n)
  }
}

/** 지금 화면의 테마 배경 전부 — 매니페스트(현재 경로) ∪ 등록된 쌍 */
export const activePairs = (path = currentRoutePath()): ThemePair[] => {
  const set = new Set<ThemePair>(manifestPairsFor(path))
  registered.forEach((_, pair) => {
    if (!pair.when || pair.when()) set.add(pair)
  })
  return [...set]
}

// ── 이미지 선요청 ────────────────────────────────────────────
type Priority = 'high' | 'low' | 'auto'

const inflight = new Map<string, Promise<void>>()
const settled = new Set<string>()

/** 이 파일이 이미 도착했는지(성공·실패 불문) — 첫 렌더에서 페이드를 건너뛰는 데 쓴다 */
export const isImageWarm = (src: string): boolean => settled.has(src)

/**
 * 파일 한 장을 브라우저 캐시(+ 서비스 워커 캐시)에 넣어 둔다. 같은 URL 은 한 번만 요청한다.
 * 실패(오프라인 등)해도 resolve 한다 — 히어로를 영영 감춰 두는 쪽이 더 나쁘다.
 */
export const warmImage = (src: string, priority: Priority = 'auto'): Promise<void> => {
  const cached = inflight.get(src)
  if (cached) return cached
  if (typeof window === 'undefined') return Promise.resolve()

  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    // fetchPriority 는 Chrome 101+/Safari 17.2+ — 없는 브라우저는 기본 우선순위로 받는다
    if ('fetchPriority' in img) (img as HTMLImageElement & { fetchPriority: Priority }).fetchPriority = priority
    const done = () => {
      settled.add(src)
      resolve()
    }
    img.onload = done
    img.onerror = done
    img.src = src
  })
  inflight.set(src, promise)
  return promise
}

const whenIdle = (fn: () => void): void => {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(fn, { timeout: 4000 })
  } else {
    window.setTimeout(fn, 1200)
  }
}

/** 현재 테마 파일이 이미 도착했는가 */
export const isPairWarm = (pair: ThemePair): boolean => isImageWarm(pairSrc(pair, currentTheme()))

/**
 * 현재 테마 파일을 받고, 끝나면 유휴 시간에 반대 테마까지 받아 둔다(토글 지연 제거).
 * 반대 테마는 첫 화면 리소스와 대역폭을 다투지 않게 현재 테마가 끝난 뒤에, 절약 모드·2G 에선 생략.
 * 반환 promise 는 현재 테마 도착 시점.
 */
export const warmPair = (pair: ThemePair): Promise<void> => {
  const theme = currentTheme()
  const promise = warmImage(pairSrc(pair, theme))
  if (preloadBudget() !== 'none') {
    void promise.then(() => whenIdle(() => void warmImage(pairSrc(pair, oppositeTheme(theme)), 'low')))
  }
  return promise
}

/** 경로의 첫 화면 배경을 데운다 — 청크 프리로드(routePreload)·라우트 진입에서 호출 */
export const warmRouteThemeAssets = (path: string): Promise<void> =>
  Promise.all(manifestPairsFor(path).map(warmPair)).then(() => undefined)

/** 지금 화면의 반대 테마 파일이 전부 도착해 있는가(동기) — 토글이 기다릴 필요가 있는지 판단 */
export const isOppositeThemeWarm = (path = currentRoutePath()): boolean => {
  const other = oppositeTheme(currentTheme())
  return activePairs(path).every((pair) => isImageWarm(pairSrc(pair, other)))
}

/** 토글 버튼 hover/focus 에서 호출 — 누르기 전에 반대 테마 배경을 낮은 우선순위로 데운다(PC) */
export const prewarmThemeToggle = (): void => {
  void warmOppositeTheme('low')
}

/**
 * 지금 화면의 반대 테마 파일을 미리 받아 둔다 — 토글 버튼 hover/focus(PC)와 토글 직전에 호출.
 * 토글 직전엔 'high' 로 불러 크로스페이드 안에 이미지가 실리게 한다.
 */
export const warmOppositeTheme = (priority: Priority = 'low', path = currentRoutePath()): Promise<void> => {
  const other = oppositeTheme(currentTheme())
  return Promise.all(activePairs(path).map((pair) => warmImage(pairSrc(pair, other), priority))).then(
    () => undefined,
  )
}
