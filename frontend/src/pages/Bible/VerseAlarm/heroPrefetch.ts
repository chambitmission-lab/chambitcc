// /bible/alarm 히어로(다이얼 카드) 배경 삽화 선요청 — Plans/heroPrefetch.ts 와 같은 이유·같은 모양.
//
// 삽화는 VerseAlarmPage.css 의 background-image 로 깔린다. CSS 배경은 두 겹으로 늦게 발견된다 —
// preload 스캐너가 URL 을 볼 수 없고(라우트 청크의 CSS 안에 있다), 매칭되는 엘리먼트가
// 실제로 렌더될 때까지 요청조차 나가지 않는다.
//
// 또 브라우저는 현재 매칭되는 한 장만 받는다 (.va-hero::before / .dark .va-hero::before).
// 라이트로 보던 사용자가 다크로 토글하면 그 순간 반대 테마 파일을 맨땅에서 받기 시작해
// 카드가 빈 배경으로 남는다 — 그래서 현재 테마를 먼저, 반대 테마를 유휴 시간에 데운다.
//
// 삽화는 ≥1440px 에서만 깔린다 — 그 아래에선 본문 칼럼이 좁아 양이 잘린다(CSS 주석 참고).
// 안 깔리는 폭에서 굳이 받아 둘 이유가 없으므로 화면 폭을 보고 건너뛴다.

const HERO_LIGHT = '/images/verse-alarm/hero-light.webp'
const HERO_DARK = '/images/verse-alarm/hero-dark.webp'

/** 삽화가 실제로 깔리는 폭인가 — VerseAlarmPage.css 의 @media (min-width: 1440px) 와 짝 */
const artApplies = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1440px)').matches

// 테마 판정은 index.html 의 테마 선적용 스크립트/ThemeContext 가 붙이는 .dark 를 따른다
const currentHero = (): string =>
  document.documentElement.classList.contains('dark') ? HERO_DARK : HERO_LIGHT

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

/** 현재 테마 삽화가 이미 도착했는지 — 첫 렌더에서 페이드를 건너뛰는 데 쓴다 */
export const isAlarmHeroWarm = (): boolean => !artApplies() || settled.has(currentHero())

/** 현재 테마 삽화를 받고, 이어서 유휴 시간에 반대 테마까지 받아 둔다(토글 지연 제거) */
export const warmAlarmHero = (): Promise<void> => {
  if (!artApplies()) return Promise.resolve()

  const current = currentHero()
  const other = current === HERO_DARK ? HERO_LIGHT : HERO_DARK

  const promise = warm(current)
  // 반대 테마는 첫 화면 리소스와 대역폭을 다투지 않게 현재 테마가 끝난 뒤 유휴 시간에
  void promise.then(() => whenIdle(() => void warm(other)))
  return promise
}
