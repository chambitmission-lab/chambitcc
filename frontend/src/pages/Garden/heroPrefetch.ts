// /garden 성경 칭호 히어로 배너 선요청.
//
// 배너는 Garden.css 의 background-image 로 깔리고, 파일은 테마 토큰
// (--garden-hero-image, theme.css)이 고른다. CSS 배경은 두 겹으로 늦게 발견된다 —
// HTML preload 스캐너가 URL 자체를 볼 수 없고(라우트 청크의 CSS 안에 있다), 매칭되는
// 엘리먼트가 실제로 렌더될 때까지 요청조차 나가지 않는다.
//
// 게다가 브라우저는 현재 테마에 매칭되는 한 장만 받는다. 그래서 라이트로 보던 사용자가
// 다크로 토글하면 그 순간 반대 테마 파일을 맨땅에서 받기 시작해 히어로가 배경색만 남은 채
// 한 박자 늦게 배너를 채웠다 — 현재 테마를 먼저, 반대 테마를 유휴 시간에 데운다.
//
// 호출 지점: routePreload 의 routeDataPrefetchers['/garden'](메뉴 호버·유휴 프리로드)와
// Garden 진입(딥링크로 바로 들어와 청크 프리로드를 거치지 않은 경우).

const HERO_LIGHT = '/images/garden/bible-title-hero-light.webp'
const HERO_DARK = '/images/garden/bible-title-hero.webp'

// 테마 판정은 index.html 의 테마 선적용 스크립트/ThemeContext 가 붙이는 .dark 를 따른다
const currentHero = (): string =>
  document.documentElement.classList.contains('dark') ? HERO_DARK : HERO_LIGHT

const inflight = new Map<string, Promise<void>>()

const warm = (src: string): Promise<void> => {
  const cached = inflight.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    // 실패(오프라인 등)해도 resolve 한다 — 히어로를 영영 감춰 두는 쪽이 더 나쁘다
    img.onload = () => resolve()
    img.onerror = () => resolve()
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

/** 현재 테마 배너를 받고, 이어서 유휴 시간에 반대 테마까지 받아 둔다(토글 지연 제거) */
export const warmGardenHero = (): Promise<void> => {
  const current = currentHero()
  const other = current === HERO_DARK ? HERO_LIGHT : HERO_DARK

  const promise = warm(current)
  // 반대 테마는 첫 화면 리소스와 대역폭을 다투지 않게 현재 테마가 끝난 뒤 유휴 시간에
  void promise.then(() => whenIdle(() => void warm(other)))
  return promise
}
