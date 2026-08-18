/**
 * 성경 낭독 영화관 — 장(chapter) 배경 장면 데이터.
 *
 * 원칙: 배경 10%, 말씀 90%. 모든 장면은 아주 어둡고 채도를 눌러서
 * 텍스트보다 절대 튀지 않는다. 사진·영상 에셋 없이 CSS 그라데이션만 쓴다
 * (번들 0KB, 어떤 화면비에서도 깨지지 않음).
 *
 * 한 장을 낭독하는 동안 낭독 진행(절 인덱스)에 따라 장면 키프레임 사이를
 * 아주 느리게 크로스페이드한다 — "창세기 1장: 어두운 우주 → 빛 → 물 → 하늘 → 땅".
 * 특별 아크가 없는 책은 장르(모세오경~계시록) 아크로 폴백한다.
 */

export interface CinemaScene {
  /** CSS background 값 (겹층 그라데이션) */
  bg: string
  /** 장면 위에 얹는 은은한 빛무리 색 (radial glow) */
  glow: string
}

// ── 공용 팔레트 헬퍼 ──────────────────────────────────────────────
// 위→아래 수직 그라데이션. 셋 다 어두운 색만 넣는다.
const sky = (top: string, mid: string, bottom: string): string =>
  `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bottom} 100%)`

// ── 특별 아크: 창세기 1장 (창조의 순서) ──────────────────────────
const GENESIS_1: CinemaScene[] = [
  {
    // 어두운 우주 — 혼돈과 공허
    bg: 'radial-gradient(130% 100% at 50% 25%, #10142a 0%, #070a16 55%, #030509 100%)',
    glow: 'rgba(90, 110, 200, 0.10)',
  },
  {
    // 빛이 있으라
    bg: 'radial-gradient(95% 85% at 50% 38%, #2e2a18 0%, #14121c 55%, #060810 100%)',
    glow: 'rgba(255, 226, 150, 0.14)',
  },
  {
    // 물 — 궁창 아래의 바다
    bg: sky('#081627', '#0b2436', '#04101c'),
    glow: 'rgba(110, 190, 220, 0.10)',
  },
  {
    // 하늘 — 궁창과 광명체
    bg: sky('#0d1f38', '#16304e', '#091323'),
    glow: 'rgba(150, 190, 255, 0.11)',
  },
  {
    // 땅과 생명 — 보시기에 좋았더라
    bg: sky('#0c1a13', '#15271c', '#080f0a'),
    glow: 'rgba(170, 220, 160, 0.10)',
  },
]

// ── 장르 아크 (bookGenre.ts와 같은 구간 기준) ─────────────────────
const LAW: CinemaScene[] = [
  // 광야 — 새벽의 시내산 → 낮의 모래 → 언약의 불기둥 밤
  { bg: sky('#171420', '#241b22', '#0d0a10'), glow: 'rgba(200, 160, 120, 0.09)' },
  { bg: sky('#1d1712', '#2a2016', '#120d08'), glow: 'rgba(235, 190, 130, 0.11)' },
  { bg: sky('#0e0d18', '#1a1420', '#070610'), glow: 'rgba(255, 170, 90, 0.12)' },
]

const HISTORY: CinemaScene[] = [
  // 성읍의 아침 → 왕궁의 등불 → 파수꾼의 밤
  { bg: sky('#181420', '#231a24', '#0e0a12'), glow: 'rgba(220, 180, 140, 0.09)' },
  { bg: sky('#1c150f', '#281d13', '#100b07'), glow: 'rgba(240, 200, 120, 0.11)' },
  { bg: sky('#0c1220', '#141c2e', '#060a14'), glow: 'rgba(140, 170, 230, 0.09)' },
]

const POETRY: CinemaScene[] = [
  // 시편의 하루 — 새벽 → 산 → 들판(해질녘)
  { bg: sky('#151228', '#251b33', '#0d0a18'), glow: 'rgba(255, 190, 160, 0.11)' },
  { bg: sky('#0d1a20', '#14262c', '#071013'), glow: 'rgba(150, 210, 210, 0.09)' },
  { bg: sky('#1a1812', '#282214', '#0f0d08'), glow: 'rgba(240, 210, 130, 0.11)' },
]

const PROPHETS: CinemaScene[] = [
  // 경고의 잿빛 노을 → 심판의 밤 → 회복의 동틈
  { bg: sky('#1d1216', '#2a181a', '#0f080a'), glow: 'rgba(255, 140, 110, 0.10)' },
  { bg: sky('#0f0c1a', '#181226', '#080612'), glow: 'rgba(160, 120, 220, 0.09)' },
  { bg: sky('#131a22', '#1d2a30', '#0a1014'), glow: 'rgba(180, 230, 230, 0.10)' },
]

const GOSPELS: CinemaScene[] = [
  // 베들레헴의 밤 → 갈릴리 호숫가 → 등불 아래의 말씀
  { bg: sky('#0c1122', '#151c33', '#060916'), glow: 'rgba(190, 210, 255, 0.11)' },
  { bg: sky('#0c1c22', '#122a30', '#061013'), glow: 'rgba(140, 210, 200, 0.10)' },
  { bg: sky('#1c1610', '#2a2014', '#100c07'), glow: 'rgba(255, 205, 130, 0.13)' },
]

const ACTS: CinemaScene[] = [
  // 오순절의 불 → 항해의 바다 → 땅끝의 지평선
  { bg: sky('#1d130e', '#2b1a12', '#100908'), glow: 'rgba(255, 160, 90, 0.12)' },
  { bg: sky('#081422', '#0e2233', '#040d17'), glow: 'rgba(120, 190, 230, 0.10)' },
  { bg: sky('#131822', '#1e2630', '#0a0e15'), glow: 'rgba(200, 220, 240, 0.10)' },
]

const EPISTLES: CinemaScene[] = [
  // 감옥의 등불 → 양피지의 밤 → 교회의 새벽
  { bg: sky('#16120e', '#221a12', '#0d0a07'), glow: 'rgba(235, 195, 130, 0.11)' },
  { bg: sky('#12101c', '#1c1826', '#0a0812'), glow: 'rgba(180, 160, 230, 0.08)' },
  { bg: sky('#101822', '#182430', '#080e14'), glow: 'rgba(160, 200, 230, 0.10)' },
]

const REVELATION: CinemaScene[] = [
  // 밧모섬의 환상 → 보좌의 영광 → 새 하늘과 새 땅
  { bg: sky('#140e24', '#1f1533', '#0a0714'), glow: 'rgba(170, 130, 240, 0.11)' },
  { bg: sky('#1c1410', '#2c2012', '#100b07'), glow: 'rgba(255, 210, 120, 0.13)' },
  { bg: sky('#0e1a24', '#153044', '#071019'), glow: 'rgba(160, 230, 255, 0.12)' },
]

const GENRE_ARCS: { max: number; scenes: CinemaScene[] }[] = [
  { max: 5, scenes: LAW },
  { max: 17, scenes: HISTORY },
  { max: 22, scenes: POETRY },
  { max: 39, scenes: PROPHETS },
  { max: 43, scenes: GOSPELS },
  { max: 44, scenes: ACTS },
  { max: 65, scenes: EPISTLES },
  { max: 66, scenes: REVELATION },
]

/** 책·장 → 장면 아크. 특별 아크(창 1장 등)가 있으면 우선, 없으면 장르 아크 */
export const getCinemaScenes = (bookNumber: number, chapter: number): CinemaScene[] => {
  if (bookNumber === 1 && chapter === 1) return GENESIS_1
  const found = GENRE_ARCS.find(a => bookNumber <= a.max)
  return bookNumber >= 1 && found ? found.scenes : GOSPELS
}
