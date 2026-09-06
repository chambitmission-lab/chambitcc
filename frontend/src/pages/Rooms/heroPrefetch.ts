// /rooms 히어로 삽화 선요청.
//
// 삽화는 rooms-hero.css 의 background-image 로 깔린다. CSS 배경은 두 겹으로 늦게 발견된다 —
// HTML preload 스캐너가 URL 자체를 볼 수 없고(라우트 청크의 CSS 안에 있다), 매칭되는
// 엘리먼트가 실제로 렌더될 때까지 요청조차 나가지 않는다. 그래서 청크를 미리 받아둬도
// 이미지만 "청크 → CSS → 렌더 → 요청" 순서로 한 왕복을 더 기다렸다.
//
// 또 브라우저는 현재 매칭되는 한 장만 받는다 (.rooms-hero-art / .dark .rooms-hero-art).
// 라이트로 보던 사용자가 다크로 토글하면 그 순간 반대 테마 파일을 맨땅에서 받기 시작해
// 히어로가 그라데이션만 남는다 — 그래서 현재 테마를 먼저, 반대 테마를 유휴 시간에 데운다.
//
// 호출 지점: /rooms 로 들어오는 유일한 길목인 PlanList 의 "공동 묵상방" 버튼(포인터 진입·터치)과
// RoomList 진입. 딥링크로 바로 들어온 경우는 RoomList 가 받아 페이드인한다.

const HERO_LIGHT = '/images/rooms/hero-light.webp'
const HERO_DARK = '/images/rooms/hero-dark.webp'

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
    // 실패(오프라인 등)해도 resolve 한다 — 히어로를 영영 감춰 두는 쪽이 더 나쁘다
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
export const isRoomsHeroWarm = (): boolean => settled.has(currentHero())

/** 현재 테마 삽화를 받고, 이어서 유휴 시간에 반대 테마까지 받아 둔다(토글 지연 제거) */
export const warmRoomsHero = (): Promise<void> => {
  const current = currentHero()
  const other = current === HERO_DARK ? HERO_LIGHT : HERO_DARK

  const promise = warm(current)
  // 반대 테마는 첫 화면 리소스와 대역폭을 다투지 않게 현재 테마가 끝난 뒤 유휴 시간에
  void promise.then(() => whenIdle(() => void warm(other)))
  return promise
}
