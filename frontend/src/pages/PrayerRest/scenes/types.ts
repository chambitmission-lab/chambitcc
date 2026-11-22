// 기도멍 장면 계약 — 장면은 그림과 "함께 머무는 사람" 표현을 맡고,
// 글상자·말씀·떠오르는 한 줄·소리는 PrayerRest 본체가 맡는다.

/** 글이 놓여 있던 영역(textarea 내용 상자, 뷰포트 좌표) — 글자가 여기서 출발한다 */
export interface OfferLayout {
  text: string
  left: number
  top: number
  width: number
  font: string
  lineHeight: number
  color: string
}

export interface SceneHandle {
  /** 기도를 올려드린다 — 글은 장면 안에서 사라지고 어디로도 보내지 않는다 */
  offer: (layout: OfferLayout) => void
}

export interface SceneProps {
  /** 나를 뺀, 지금 함께 머무는 사람 수 */
  others: number
}
