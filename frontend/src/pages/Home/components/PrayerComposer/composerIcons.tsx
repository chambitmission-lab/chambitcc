// 기도 작성 시트 전용 아이콘 — 시트가 lazyModal 청크라 여기서만 받는다(엔트리 EmotionIcons.tsx 와 분리)
import { DiceFive, DoorOpen, Eye, GlobeSimple, LockSimple } from '../../../../components/icons/phosphor'
import { duotone } from '../duotoneIcon'

/** 공개 범위 — 전체 공개 / 나만 보기 / 실명 */
export const GlobeIcon = duotone(GlobeSimple)
export const LockIcon = duotone(LockSimple)
export const EyeIcon = duotone(Eye)
/** 골방 기도자(익명) — 마 6:6 "골방에 들어가 문을 닫고" */
export const ClosetIcon = duotone(DoorOpen)
/** 기도 씨앗 다시 뽑기 */
export const DiceIcon = duotone(DiceFive)
