import { scheduleAfterFirstScreen } from './idlePreload'

// 일부 화면만 쓰는 니치 서체 — 첫 화면이 끝난 뒤(load 직후) 스타일시트를 붙인다.
// index.html 에 media="print" 로 두면 렌더는 안 막아도 CSS 자체(Noto Serif KR 187KB·Nanum Pen 58KB)를
// 첫 화면 리소스와 함께 받는다. 폰트 파일은 어차피 해당 글꼴이 실제로 쓰일 때만 내려온다.
//  - Orbitron: 프로필 카드 스탯/시리얼 넘버
//  - Noto Serif KR: 성경 Aa 설정의 '명조' 읽기 서체 + 홈 말씀 카드(오늘의 묵상 핵심 절·올해의 말씀)
//  - Nanum Pen Script: 타임캡슐·인사말 편지의 손글씨
//  - Nanum Brush Script: 말씀 카드 붓글씨
const SHEETS = [
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&display=swap',
  // 700 은 홈 '올해의 말씀' 대형 인용과 말씀 카드(photoVerseCanvas)가 실제로 요청하는 웨이트다
  // — 없으면 브라우저가 600 을 가짜 볼드로 늘려 획이 뭉갠다.
  // 500 은 말씀 카드 본문 — 사진 위에서 인쇄물처럼 보이는 가벼운 획 (없으면 400 으로 떨어져 너무 얇다)
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap',
  // 말씀 카드 붓글씨 서체 — 세로쓰기 족자 프리셋
  'https://fonts.googleapis.com/css2?family=Nanum+Brush+Script&display=swap',
]

let loaded = false

const append = () => {
  if (loaded) return
  loaded = true
  for (const href of SHEETS) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }
}

/** 앱 부팅 시 한 번 호출 — load 직후 유휴 시간에 붙인다 */
export const loadDeferredFonts = (): void => {
  scheduleAfterFirstScreen(append, { settleMs: 0, idleTimeoutMs: 2000 })
}

/** 명조 읽기처럼 사용자가 방금 고른 서체는 기다리지 않고 즉시 붙인다 */
export const ensureDeferredFontsNow = (): void => append()
