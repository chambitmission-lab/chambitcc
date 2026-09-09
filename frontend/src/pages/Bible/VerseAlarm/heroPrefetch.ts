// /bible/alarm 히어로(다이얼 카드) 배경 삽화 선요청 — Plans/heroPrefetch.ts 와 같은 이유·같은 모양.
//
// 삽화는 VerseAlarmPage.css 의 background-image 로 깔린다. CSS 배경은 두 겹으로 늦게 발견된다 —
// preload 스캐너가 URL 을 볼 수 없고(라우트 청크의 CSS 안에 있다), 매칭되는 엘리먼트가
// 실제로 렌더될 때까지 요청조차 나가지 않는다.
//
// 또 브라우저는 현재 매칭되는 것만 받는다 (.va-hero::before / .dark .va-hero::before).
// 라이트로 보던 사용자가 다크로 토글하면 그 순간 반대 테마 파일을 맨땅에서 받기 시작해
// 카드가 빈 배경으로 남는다 — 그래서 현재 테마를 먼저, 반대 테마를 유휴 시간에 데운다.
//
// 폭에 따라 쓰는 에셋이 다르다(CSS 주석 참고) — ≥1440px 은 장면 한 장, 그 아래는
// 양쪽 바닥에 세우는 두 조각. 안 쓰는 쪽을 받아 둘 이유는 없으므로 화면 폭을 보고 고른다.

const HERO = { light: '/images/verse-alarm/hero-light.webp', dark: '/images/verse-alarm/hero-dark.webp' }
const PIECES = {
  light: ['/images/verse-alarm/mobile-lamb-light.webp', '/images/verse-alarm/mobile-sheep-light.webp'],
  dark: ['/images/verse-alarm/mobile-lamb-dark.webp', '/images/verse-alarm/mobile-sheep-dark.webp'],
}

/** 장면 한 장을 통째로 까는 폭인가 — VerseAlarmPage.css 의 @media (min-width: 1440px) 와 짝 */
const wideScene = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1440px)').matches

// 테마 판정은 index.html 의 테마 선적용 스크립트/ThemeContext 가 붙이는 .dark 를 따른다
const isDark = (): boolean => document.documentElement.classList.contains('dark')

const assetsFor = (dark: boolean): string[] =>
  wideScene() ? [dark ? HERO.dark : HERO.light] : dark ? PIECES.dark : PIECES.light

const inflight = new Map<string, Promise<void>>()
const settled = new Set<string>()

const warm = (src: string): Promise<void> => {
  const cached = inflight.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    // 실패(오프라인 등)해도 resolve 한다 — 카드를 영영 비워 두는 쪽이 더 나쁘다
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

/** 현재 테마 삽화가 이미 다 도착했는지 — 첫 렌더에서 페이드를 건너뛰는 데 쓴다 */
export const isAlarmHeroWarm = (): boolean =>
  typeof window !== 'undefined' && assetsFor(isDark()).every((src) => settled.has(src))

/** 현재 테마 삽화를 받고, 이어서 유휴 시간에 반대 테마까지 받아 둔다(토글 지연 제거) */
export const warmAlarmHero = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve()

  const dark = isDark()
  const promise = Promise.all(assetsFor(dark).map(warm)).then(() => undefined)
  // 반대 테마는 첫 화면 리소스와 대역폭을 다투지 않게 현재 테마가 끝난 뒤 유휴 시간에
  void promise.then(() => whenIdle(() => void Promise.all(assetsFor(!dark).map(warm))))
  return promise
}
