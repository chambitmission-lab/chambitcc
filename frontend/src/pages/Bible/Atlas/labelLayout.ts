import type { Point } from './projection'

// 지명 라벨 자동 배치.
//
// 성경의 도시들은 실제로 서로 매우 가깝다 — 버가와 앗달리아는 17km,
// 안디옥과 실루기아는 25km 밖에 떨어져 있지 않다. 여정 전체가 보이도록
// 지도를 맞추면 핀끼리 겹치고 라벨은 아예 읽을 수 없게 된다.
//
// 그래서 라벨 위치를 데이터에 손으로 박아 넣지 않고(확대 배율이 바뀌면
// 어차피 다시 어긋난다) 매 렌더마다 화면 좌표에서 자리를 찾는다.
//   1순위: 핀 바로 옆 8방향
//   2순위: 조금 떨어진 8방향 + 지시선(leader)
//   3순위: 더 멀리 8방향 + 지시선 (유대 산지처럼 도시가 촘촘한 구간)
// 그래도 자리가 없으면 숨긴다 — 겹쳐 읽히느니 안 보이는 편이 낫고,
// 확대하면 자리가 생겨 다시 나타난다.

export interface LabelBox {
  /** 핀 끝점 기준 오프셋 (화면 px) */
  dx: number
  dy: number
  anchor: 'middle' | 'start' | 'end'
  /** 핀에서 떨어져 있어 지시선을 그려야 하는가 */
  leader: boolean
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const FONT_PX = 12
const LINE_H = 14
// 한글은 폭이 거의 글자 크기와 같다 — 라틴 문자 기준으로 재면 겹침을 놓친다
const textWidth = (text: string) =>
  [...text].reduce((sum, ch) => sum + (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch) ? FONT_PX : FONT_PX * 0.56), 0)

const PIN_H = 26 // 핀 높이 (화면 px) — 끝점 기준 위로 뻗는다
const GAP = 2

/** 핀 바로 옆 자리 — 아래·위를 먼저 쓰고, 막히면 좌우·대각선 */
const NEAR: LabelBox[] = [
  { dx: 0, dy: 13, anchor: 'middle', leader: false },
  { dx: 0, dy: -PIN_H - 7, anchor: 'middle', leader: false },
  { dx: 11, dy: -PIN_H / 2 - 1, anchor: 'start', leader: false },
  { dx: -11, dy: -PIN_H / 2 - 1, anchor: 'end', leader: false },
  { dx: 10, dy: 11, anchor: 'start', leader: false },
  { dx: -10, dy: 11, anchor: 'end', leader: false },
  { dx: 11, dy: -PIN_H - 4, anchor: 'start', leader: false },
  { dx: -11, dy: -PIN_H - 4, anchor: 'end', leader: false },
]

/** 조금 떨어진 자리 — 지시선을 함께 그린다 */
const FAR: LabelBox[] = [
  { dx: 0, dy: 30, anchor: 'middle', leader: true },
  { dx: 0, dy: -PIN_H - 24, anchor: 'middle', leader: true },
  { dx: 30, dy: 6, anchor: 'start', leader: true },
  { dx: -30, dy: 6, anchor: 'end', leader: true },
  { dx: 28, dy: -PIN_H - 14, anchor: 'start', leader: true },
  { dx: -28, dy: -PIN_H - 14, anchor: 'end', leader: true },
  { dx: 28, dy: 28, anchor: 'start', leader: true },
  { dx: -28, dy: 28, anchor: 'end', leader: true },
]

const rectOf = (screen: Point, box: LabelBox, width: number): Rect => {
  const x =
    box.anchor === 'middle'
      ? screen.x + box.dx - width / 2
      : box.anchor === 'start'
        ? screen.x + box.dx
        : screen.x + box.dx - width
  return { x, y: screen.y + box.dy - LINE_H / 2, w: width, h: LINE_H }
}

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w + GAP &&
  a.x + a.w + GAP > b.x &&
  a.y < b.y + b.h + GAP &&
  a.y + a.h + GAP > b.y

/** 핀 머리(원)가 차지하는 영역 — 라벨이 다른 핀을 덮지 않도록 함께 피한다 */
const pinRect = (screen: Point): Rect => ({
  x: screen.x - 9,
  y: screen.y - PIN_H,
  w: 18,
  h: PIN_H,
})

export interface LabelInput {
  id: string
  /** 화면 좌표(px) — 핀 끝점 */
  screen: Point
  text: string
  /** 먼저 자리를 잡을 핀 (여정 순서가 빠른 쪽이 좋은 자리를 갖는다) */
  priority: number
}

/**
 * 더 멀리 밀어낸 자리 — 유대 산지처럼 도시가 촘촘한 구간에서만 쓰인다.
 * 벧엘·예루살렘·헤브론은 서로 20km 안팎이라 가까운 자리로는 다 담기지 않는다.
 */
const FARTHER: LabelBox[] = [
  { dx: 52, dy: 4, anchor: 'start', leader: true },
  { dx: -52, dy: 4, anchor: 'end', leader: true },
  { dx: 46, dy: -PIN_H - 22, anchor: 'start', leader: true },
  { dx: -46, dy: -PIN_H - 22, anchor: 'end', leader: true },
  { dx: 46, dy: 44, anchor: 'start', leader: true },
  { dx: -46, dy: 44, anchor: 'end', leader: true },
  { dx: 0, dy: 50, anchor: 'middle', leader: true },
  { dx: 0, dy: -PIN_H - 44, anchor: 'middle', leader: true },
]

export const layoutLabels = (items: LabelInput[]): Map<string, LabelBox | null> => {
  const taken: Rect[] = items.map((item) => pinRect(item.screen))
  const result = new Map<string, LabelBox | null>()

  for (const item of [...items].sort((a, b) => a.priority - b.priority)) {
    const width = textWidth(item.text)
    let chosen: LabelBox | null = null
    for (const candidate of [...NEAR, ...FAR, ...FARTHER]) {
      const rect = rectOf(item.screen, candidate, width)
      if (taken.some((other) => overlaps(rect, other))) continue
      chosen = candidate
      taken.push(rect)
      break
    }
    result.set(item.id, chosen)
  }

  return result
}
