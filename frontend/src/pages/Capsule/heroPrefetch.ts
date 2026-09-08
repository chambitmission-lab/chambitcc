// /capsule 히어로 삽화 선요청.
//
// 삽화는 capsule.css 의 background-image 로 깔린다. CSS 배경은 두 겹으로 늦게 발견된다 —
// HTML preload 스캐너가 URL 자체를 볼 수 없고(라우트 청크의 CSS 안에 있다), 매칭되는
// 엘리먼트가 실제로 렌더될 때까지 요청조차 나가지 않는다. 그래서 청크를 미리 받아둬도
// 이미지만 "청크 → CSS → 렌더 → 요청" 순서로 한 왕복을 더 기다렸다.
//
// 또 브라우저는 현재 매칭되는 한 장만 받는다 (.capsule-hero-art / .dark .capsule-hero-art).
// 라이트로 보던 사용자가 다크로 토글하면 그 순간 반대 테마 파일을 맨땅에서 받기 시작해
// 히어로가 그라데이션만 남는다 — 그래서 현재 테마를 먼저, 반대 테마를 유휴 시간에 데운다.
//
// 호출 지점: /capsule 로 들어오는 길목인 홈 타임캡슐 배너(TimeCapsuleCard)의 유휴 콜백과
// CapsuleList 진입. 딥링크로 바로 들어온 경우는 CapsuleList 가 받아 페이드인한다.

const HERO_LIGHT = '/images/capsule/hero-light.webp'
const HERO_DARK = '/images/capsule/hero-dark.webp'
// 개봉 후 편지 화면의 하늘 삽화 — 히어로와 같은 짝(라이트/다크) 구조
const LETTER_LIGHT = '/images/capsule/letter-light.webp'
const LETTER_DARK = '/images/capsule/letter-dark.webp'
// 봉인 대기 화면의 금고 삽화 (capsule.css .capsule-waiting --vault-art)
const SEALED_LIGHT = '/images/capsule/sealed-light.webp'
const SEALED_DARK = '/images/capsule/sealed-dark.webp'

// 테마 판정은 index.html 의 테마 선적용 스크립트/ThemeContext 가 붙이는 .dark 를 따른다
const isDark = (): boolean => document.documentElement.classList.contains('dark')
const currentHero = (): string => (isDark() ? HERO_DARK : HERO_LIGHT)

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
export const isCapsuleHeroWarm = (): boolean => settled.has(currentHero())

/** 현재 테마 삽화를 받고, 이어서 유휴 시간에 반대 테마까지 받아 둔다(토글 지연 제거) */
export const warmCapsuleHero = (): Promise<void> => {
  const current = currentHero()
  const other = current === HERO_DARK ? HERO_LIGHT : HERO_DARK

  const promise = warm(current)
  // 반대 테마는 첫 화면 리소스와 대역폭을 다투지 않게 현재 테마가 끝난 뒤 유휴 시간에
  void promise.then(() => whenIdle(() => void warm(other)))
  return promise
}

/** 현재 테마 파일을 받고, 끝나면 유휴 시간에 반대 테마까지 받아 둔다(테마 토글 지연 제거) */
const warmPair = (light: string, dark: string): Promise<void> => {
  const current = isDark() ? dark : light
  const other = current === dark ? light : dark

  const promise = warm(current)
  void promise.then(() => whenIdle(() => void warm(other)))
  return promise
}

/** 봉인 대기 화면(아직 못 여는 캡슐)의 금고 삽화 —
    현재 테마는 CSS가 이미 요청하지만, 반대 테마는 토글 순간에야 처음 받기 시작해
    첫 토글에서 배경만 한 박자 늦게 바뀐다. 여기서 미리 받아 두면 두 번째처럼 즉시 바뀐다. */
export const warmCapsuleSealedArt = (): Promise<void> => warmPair(SEALED_LIGHT, SEALED_DARK)

/** 개봉 직전(봉투 화면)에 편지 하늘을 미리 받아 둔다 —
    인장을 뜯고 편지가 올라오는 1.7초 안에 하늘이 이미 자리에 있게. */
export const warmCapsuleLetterArt = (): Promise<void> => warmPair(LETTER_LIGHT, LETTER_DARK)
