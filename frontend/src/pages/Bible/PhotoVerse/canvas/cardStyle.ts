// 말씀 카드 스타일 — 옵션 타입 · 기본값 · 서체 스택 · 색 유틸.

export type CardFilterId =
  | 'none'
  | 'clear'
  | 'film'
  | 'fade'
  | 'warm'
  | 'cool'
  | 'golden'
  | 'sepia'
  | 'mono'
  | 'dawn'
export type CardFrameId = 'none' | 'season' | 'polaroid' | 'film'
export type CardLayoutId = 'classic' | 'gallery' | 'quote' | 'focus' | 'poster' | 'vertical'
export type CardTextureId = 'grain' | 'leak' | 'vignette' | 'stamp'
export type CardRatioId = 'original' | '1:1' | '4:5' | '9:16'
export type CardTextBg = 'none' | 'soft' | 'scrim' | 'marker'

export interface VerseCardStyle {
  color: string
  /** 글자 크기 — 이미지 너비 대비 비율 (0.03 ~ 0.09) */
  fontScale: number
  fontFamily: 'sans' | 'serif' | 'hand' | 'brush'
  align: 'left' | 'center' | 'right'
  /** 텍스트 뒤 배경 — 은은한 라디얼 스크림 / 반투명 박스 / 형광펜 자국 */
  textBg: CardTextBg
  /** 출처(책 장:절) 표기 */
  showRef: boolean
  /** 텍스트 블록 중심 — 사진 영역 대비 0~1 비율 좌표 (자유 레이아웃에서만 사용) */
  pos: { x: number; y: number }
  /** 감성 필터 */
  filter: CardFilterId
  /** 프레임 — 절기(교회력 스탬프) / 폴라로이드(여백+손글씨 출처) / 필름(비네트+날짜 스탬프) */
  frame: CardFrameId
  /** 타이포 레이아웃 프리셋 */
  layout: CardLayoutId
  /** 질감 레이어 — 다중 선택 */
  textures: CardTextureId[]
  /** 캔버스 비율 — 사진을 센터 크롭한다 */
  ratio: CardRatioId
  /** 절기 스탬프·서명 언어 */
  lang: 'ko' | 'en'
  /** 모서리의 작은 교회 서명 — 공유된 카드가 어디서 왔는지 조용히 말해준다 */
  signature: boolean
}

export const DEFAULT_CARD_STYLE: VerseCardStyle = {
  color: '#ffffff',
  fontScale: 0.055,
  fontFamily: 'serif',
  align: 'center',
  textBg: 'soft',
  showRef: true,
  pos: { x: 0.5, y: 0.45 },
  filter: 'none',
  frame: 'none',
  layout: 'classic',
  textures: [],
  ratio: 'original',
  lang: 'ko',
  signature: true,
}

const FONT_STACKS: Record<VerseCardStyle['fontFamily'], string> = {
  sans: '"Pretendard Variable", "Pretendard", -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  serif: '"Noto Serif KR", "Apple SD Gothic Neo", serif',
  hand: '"Nanum Pen Script", "Apple SD Gothic Neo", cursive',
  brush: '"Nanum Brush Script", "Apple SD Gothic Neo", cursive',
}

// 본문은 굵은 600 대신 500 — 사진 위에서 '인쇄물'처럼 보이는 건 가벼운 획과 넉넉한 행간이다.
// 손글씨는 같은 px에서 시각적으로 작게 보여 크기를 보정한다
const FONT_TUNING: Record<
  VerseCardStyle['fontFamily'],
  { weight: number; sizeMul: number; lineHeight: number; tracking: number }
> = {
  sans: { weight: 500, sizeMul: 1, lineHeight: 1.6, tracking: -0.005 },
  serif: { weight: 500, sizeMul: 1, lineHeight: 1.66, tracking: 0 },
  hand: { weight: 400, sizeMul: 1.3, lineHeight: 1.42, tracking: 0 },
  // 붓글씨는 획이 가늘고 자폭이 작아 크게 보정한다
  brush: { weight: 400, sizeMul: 1.42, lineHeight: 1.4, tracking: 0.02 },
}

// 출처 라벨은 본문 서체와 무관하게 고딕 자간 넓게 — 에디토리얼 인쇄물의 캡션 문법
const REF_FAMILY = FONT_STACKS.sans

const SIGNATURE_TEXT: Record<'ko' | 'en', string> = { ko: '참빛교회', en: 'CHAMBIT CHURCH' }

// letterSpacing은 최신 브라우저만 지원 — 미지원이면 조용히 무시된다
const setTracking = (ctx: CanvasRenderingContext2D, px: number) => {
  try {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`
  } catch {
    /* 미지원 브라우저 */
  }
}

/** 썸네일(작은 캔버스)에서는 최소 px 클램프를 풀어 구도가 그대로 축소돼 보이게 한다 */
const THUMB_WIDTH = 300
const minPx = (pw: number, v: number, min: number) => (pw < THUMB_WIDTH ? v : Math.max(min, v))

// ── 색 유틸 ────────────────────────────────────────────────────
const parseHex = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const luminanceOf = (hex: string): number => {
  const [r, g, b] = parseHex(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

const isLightColor = (hex: string) => luminanceOf(hex) > 0.55


// ── photoVerseCanvas 내부 공유 ──
export { FONT_STACKS, FONT_TUNING, REF_FAMILY, SIGNATURE_TEXT, setTracking, THUMB_WIDTH, minPx, parseHex, luminanceOf, isLightColor }
