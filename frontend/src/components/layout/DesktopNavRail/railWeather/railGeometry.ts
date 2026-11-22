/* 레일 하단 삽화(rail/bottom-mailbox-*.webp, 248 × 349 CSS px) 속 좌표 — 날씨(railWeatherScene)·나무(railTreeScene)가 함께 쓴다.
 * 이미지 기준 좌표(왼쪽 위 0,0). 삽화를 다시 구우면 이 좌표도 함께 확인해야 한다. */

/** 앞 언덕 능선(예배당이 선 언덕) — 손으로 짚었다 */
export const RIDGE_F_PTS: [number, number][] = [[34, 277], [44, 272], [56, 269], [68, 268], [80, 265], [92, 261], [104, 255], [116, 251], [128, 246],
  [140, 242], [152, 239.5], [158, 239], [194, 239.5], [200, 238.5], [212, 240], [224, 245], [236, 248], [246, 252]]

/** 삽화 높이와 칸 바닥 아래로 내린 양(DesktopNavRail.css 의 calc(100% + 48px)) —
 *  칸 높이 H 에서 이미지 y 는 캔버스 y = iy + H - (ART_H - ART_DROP_PX) */
export const ART_H = 349
export const ART_DROP_PX = 48

/** 앞 능선의 y(이미지 기준). 범위 밖이면 양 끝 값 */
export const frontRidgeY = (x: number): number => {
  const p = RIDGE_F_PTS
  if (x <= p[0][0]) return p[0][1]
  for (let k = 0; k < p.length - 1; k++) {
    const [x0, y0] = p[k], [x1, y1] = p[k + 1]
    if (x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
  }
  return p[p.length - 1][1]
}

/** 왼쪽 뒷언덕 능선(우체통 뒤로 솟은 언덕) — 왼쪽 마루(x 20~62)는 그림 픽셀에서 읽고, 그 뒤 내리막은 날씨 엔진이 쓰던 점 */
export const RIDGE_L_PTS: [number, number][] = [[20, 198], [36, 198.5], [52, 200.5], [62, 203], [70, 207], [80, 212], [92, 218], [104, 221],
  [116, 223], [128, 226], [140, 231], [150, 235]]

const lineY = (p: [number, number][], x: number): number => {
  if (x <= p[0][0]) return p[0][1]
  for (let k = 0; k < p.length - 1; k++) {
    const [x0, y0] = p[k], [x1, y1] = p[k + 1]
    if (x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
  }
  return p[p.length - 1][1]
}

/** 뒷언덕 능선 y — 뒷언덕이 앞 언덕 뒤로 숨는 x 150 너머는 앞 능선 */
export const backRidgeY = (x: number): number => (x <= 150 ? lineY(RIDGE_L_PTS, x) : frontRidgeY(x))
