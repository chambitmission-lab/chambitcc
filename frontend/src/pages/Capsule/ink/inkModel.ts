// 손글씨 편지 — 획 데이터 모델과 상수.
// 화면 크기와 무관하게 논리 좌표(가로 1000 × 세로 1414, A판 비율)로 저장한다.
// 색은 hex가 아니라 '색 번호'로 저장해 개봉 화면 테마(크림 편지지 / 밤하늘 편지지)에 맞춰 다시 입힌다.

export const INK_PAGE_W = 1000
export const INK_PAGE_H = 1414
/** 괘선 간격·첫 줄 위치(논리 단위). 편지지 재질은 이 두 값으로 그린다 */
export const INK_LINE_GAP = 80
export const INK_LINE_TOP = 96
export const INK_MAX_PAGES = 4
/** 한 장에 허용하는 획 수 — 그림을 그려도 JSON이 수 MB가 되지 않게 */
export const INK_MAX_STROKES_PER_PAGE = 2500

export type InkColorIndex = 0 | 1 | 2

export interface InkStroke {
  /** 색 번호 — INK_COLORS 인덱스 */
  c: InkColorIndex
  /** 굵기(논리 단위) */
  s: number
  /** 1이면 필압 없는 입력(손가락·마우스) — 속도로 필압을 흉내 낸다 */
  sim?: 1
  /** [x, y, 필압, x, y, 필압, …] 평탄 배열 */
  p: number[]
}

export interface InkPage {
  strokes: InkStroke[]
}

/** R2에 올리는 한 장짜리 JSON */
export interface InkPageFile {
  v: 1
  w: number
  h: number
  strokes: InkStroke[]
}

export type InkTheme = 'light' | 'dark'

/** 펜 색 — 라이트는 크림 종이 위 잉크, 다크는 밤하늘 편지지(미드나잇 네이비) 위 잉크.
    개봉 편지지의 --p-* 팔레트와 같은 결 (앱 테마 토큰 금지 원칙) */
export const INK_COLORS: { key: string; label: string; light: string; dark: string }[] = [
  { key: 'ink', label: '먹색', light: '#2b2a28', dark: '#ece2cc' },
  { key: 'navy', label: '남색', light: '#2f4a8a', dark: '#a9bde9' },
  { key: 'brown', label: '밤색', light: '#6e4a2e', dark: '#d9a441' },
]

export const INK_SIZES: { key: string; label: string; size: number }[] = [
  { key: 'thin', label: '가늘게', size: 4.4 },
  { key: 'mid', label: '보통', size: 6.2 },
  { key: 'bold', label: '굵게', size: 8.8 },
]

export const emptyInkPage = (): InkPage => ({ strokes: [] })

export const isInkPageEmpty = (page: InkPage): boolean => page.strokes.length === 0

/** 비어 있지 않은 장만 — 봉인할 때·미리보기 수를 셀 때 */
export const filledInkPages = (pages: InkPage[]): InkPage[] => pages.filter((p) => !isInkPageEmpty(p))

export const inkPointCount = (page: InkPage): number =>
  page.strokes.reduce((n, s) => n + s.p.length / 3, 0)

export const inkColorFor = (index: number, theme: InkTheme): string =>
  (INK_COLORS[index] ?? INK_COLORS[0])[theme]

/** 저장 직전 좌표를 줄인다 — 소수 한 자리면 화면에서 구분이 안 된다 (JSON 크기 절반) */
export const toInkPageFile = (page: InkPage): InkPageFile => ({
  v: 1,
  w: INK_PAGE_W,
  h: INK_PAGE_H,
  strokes: page.strokes.map((s) => ({
    ...s,
    s: Math.round(s.s * 10) / 10,
    p: s.p.map((v, i) => (i % 3 === 2 ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10)),
  })),
})

/** 개봉 화면이 R2에서 받은 JSON을 검증해 읽는다 — 모양이 어긋나면 null(PNG 폴백) */
export const parseInkPageFile = (raw: unknown): InkPage | null => {
  if (!raw || typeof raw !== 'object') return null
  const file = raw as Partial<InkPageFile>
  if (file.v !== 1 || !Array.isArray(file.strokes)) return null
  const sx = INK_PAGE_W / (Number(file.w) || INK_PAGE_W)
  const sy = INK_PAGE_H / (Number(file.h) || INK_PAGE_H)
  const strokes: InkStroke[] = []
  for (const s of file.strokes) {
    if (!s || !Array.isArray(s.p) || s.p.length < 3) continue
    const p =
      sx === 1 && sy === 1
        ? s.p.map(Number)
        : s.p.map((v, i) => (i % 3 === 0 ? Number(v) * sx : i % 3 === 1 ? Number(v) * sy : Number(v)))
    strokes.push({
      c: ([0, 1, 2].includes(Number(s.c)) ? Number(s.c) : 0) as InkColorIndex,
      s: Number(s.s) || INK_SIZES[1].size,
      ...(s.sim ? { sim: 1 as const } : {}),
      p,
    })
  }
  return { strokes }
}
