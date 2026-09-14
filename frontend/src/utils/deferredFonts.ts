import { scheduleAfterFirstScreen } from './idlePreload'

// 일부 화면만 쓰는 니치 서체 — 첫 화면이 끝난 뒤(load 직후) 스타일시트를 붙인다.
// index.html 에 media="print" 로 두면 렌더는 안 막아도 CSS 자체(Noto Serif KR 187KB·Nanum Pen 58KB)를
// 첫 화면 리소스와 함께 받는다. 폰트 파일은 어차피 해당 글꼴이 실제로 쓰일 때만 내려온다.
//
// 두 부류로 나눈다.
//  - 항상(부팅 직후 유휴 시간): Noto Serif KR — 홈 말씀 카드(오늘의 묵상 핵심 절·올해의 말씀)·
//    기도 카드·성경 '명조' 읽기 서체처럼 첫 화면과 거의 모든 화면이 쓴다.
//  - 필요할 때(ensureFontFamily): 아래 셋은 특정 화면에서만 쓰는데 예전엔 전 사용자가 앱을 켤 때마다
//    구글 폰트 CSS 왕복 3번을 더 치렀다. 쓰는 화면의 모듈이 로드될 때(라우트 청크 평가 시점) 붙인다.
//      Orbitron          : 말씀 카드(photoVerseCanvas) 날짜 스탬프
//      Nanum Pen Script  : 타임캡슐·인사말 편지·목양칼럼 손글씨, 챗봇 말풍선
//      Nanum Brush Script: 말씀 카드 붓글씨(세로쓰기 족자 프리셋)
const ALWAYS_SHEETS = [
  // 700 은 홈 '올해의 말씀' 대형 인용과 말씀 카드(photoVerseCanvas)가 실제로 요청하는 웨이트다
  // — 없으면 브라우저가 600 을 가짜 볼드로 늘려 획이 뭉갠다.
  // 500 은 말씀 카드 본문 — 사진 위에서 인쇄물처럼 보이는 가벼운 획 (없으면 400 으로 떨어져 너무 얇다)
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap',
]

export type DeferredFontFamily = 'orbitron' | 'nanumPen' | 'nanumBrush'

const ON_DEMAND_SHEETS: Record<DeferredFontFamily, string> = {
  orbitron: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&display=swap',
  nanumPen: 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap',
  nanumBrush: 'https://fonts.googleapis.com/css2?family=Nanum+Brush+Script&display=swap',
}

// href → 스타일시트가 CSSOM 에 들어간(또는 실패한) 시점에 resolve 되는 Promise.
// canvas 는 document.fonts.load() 전에 @font-face 선언이 있어야 실제 폰트를 기다리므로
// 말씀 카드처럼 그리기 직전에 호출하는 쪽은 이 Promise 를 await 한다.
const appended = new Map<string, Promise<void>>()

const appendSheet = (href: string): Promise<void> => {
  const existing = appended.get(href)
  if (existing) return existing
  const p = new Promise<void>((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => resolve()
    link.onerror = () => resolve() // 실패해도 폴백 서체로 그린다 — 호출부를 막지 않는다
    document.head.appendChild(link)
  })
  appended.set(href, p)
  return p
}

const appendAlways = () => {
  for (const href of ALWAYS_SHEETS) void appendSheet(href)
}

/** 앱 부팅 시 한 번 호출 — load 직후 유휴 시간에 붙인다 */
export const loadDeferredFonts = (): void => {
  scheduleAfterFirstScreen(appendAlways, { settleMs: 0, idleTimeoutMs: 2000 })
}

/** 명조 읽기처럼 사용자가 방금 고른 서체는 기다리지 않고 즉시 붙인다 */
export const ensureDeferredFontsNow = (): void => appendAlways()

/** 특정 화면 전용 서체 — 쓰는 모듈이 로드될 때 호출한다(중복 호출은 무시). */
export const ensureFontFamily = (family: DeferredFontFamily): Promise<void> =>
  typeof document === 'undefined' ? Promise.resolve() : appendSheet(ON_DEMAND_SHEETS[family])
