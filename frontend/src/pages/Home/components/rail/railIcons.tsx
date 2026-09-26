// PC 우측 위젯 레일 전용 아이콘 — 레일이 lazy 청크라 여기서만 받는다(엔트리 EmotionIcons.tsx 와 분리)
import { Alarm, CalendarDots, Tag } from '../../../../components/icons/phosphor'
import { duotone } from '../duotoneIcon'

/** 우측 레일 섹션 제목용 아이콘 */
export const TagIcon = duotone(Tag)
export const CalendarIcon = duotone(CalendarDots)
/** 우측 레일 액션 벤토 타일용 */
export const AlarmIcon = duotone(Alarm)
