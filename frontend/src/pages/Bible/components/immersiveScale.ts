import { safeStorage } from '../../../utils/safeStorage'

/**
 * 몰입 모드(집중 읽기·낭독 영화관) 전용 글자 크기 단계.
 * 오버레이 안에서는 Aa 패널을 열 수 없어 상단 바에 가−/가+ 를 따로 두고,
 * 두 모드가 같은 값을 공유한다(어르신이 한 번 키우면 어디서나 그 크기).
 * CSS 에서는 Aa 배율(--bible-font-scale)에 곱해진다.
 */
export const IMMERSIVE_SCALES = [1, 1.15, 1.3, 1.5]

const KEY = 'bible-immersive-scale-v1'

export const loadImmersiveScaleIdx = (): number => {
  const n = Number(safeStorage.get(KEY))
  return Number.isInteger(n) && IMMERSIVE_SCALES[n] !== undefined ? n : 0
}

export const saveImmersiveScaleIdx = (idx: number) => {
  safeStorage.set(KEY, String(idx)) // 저장 실패 시 이번 세션만 적용
}

export const stepImmersiveScaleIdx = (idx: number, dir: 1 | -1): number =>
  Math.min(IMMERSIVE_SCALES.length - 1, Math.max(0, idx + dir))
