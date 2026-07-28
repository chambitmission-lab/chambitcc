// 구간 안내 기도(ACTS) — 기도 시간을 4등분해 경배→회개→감사→간구 순서로 이끈다.
// 포모도로의 세션 분할 개념을 기도 흐름에 옮긴 것.

export interface ActsSegment {
  id: 'adoration' | 'confession' | 'thanksgiving' | 'supplication'
  /** material-icons-outlined 이름 */
  icon: string
  labelKey: string
  /** 구간 진입 시 잔잔히 띄울 한 줄 안내 */
  guideKey: string
}

export const ACTS_SEGMENTS: ActsSegment[] = [
  { id: 'adoration', icon: 'auto_awesome', labelKey: 'actsAdoration', guideKey: 'actsAdorationGuide' },
  { id: 'confession', icon: 'spa', labelKey: 'actsConfession', guideKey: 'actsConfessionGuide' },
  { id: 'thanksgiving', icon: 'favorite', labelKey: 'actsThanksgiving', guideKey: 'actsThanksgivingGuide' },
  { id: 'supplication', icon: 'volunteer_activism', labelKey: 'actsSupplication', guideKey: 'actsSupplicationGuide' },
]
