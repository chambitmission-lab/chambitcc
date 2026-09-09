import type { MouseEvent } from 'react'
import { CommentIcon } from '../../../../components/icons/ActionIcons'

interface VerseTogetherChipProps {
  /** 이 절에 남겨진 묵상 수 */
  reflectionCount: number
  /** 이어읽기(문단) 보기 — 인라인 배지 */
  inline?: boolean
  onOpen: () => void
}

/**
 * 이 절에 묵상이 있다는 표시. 0이면 아무것도 그리지 않는다 — 대부분의 절은 조용해야 한다.
 *
 * 절별 보기에서는 본문 흐름이 아니라 '절 번호와 본문 사이 여백'에 절대 위치로 올린다.
 * 숫자는 장을 여는 도중(요약 쿼리)이나 다른 성도가 묵상을 남길 때(SSE) 뒤늦게 도착하는데,
 * 이전처럼 절 아래 칩을 흐름에 끼우면 읽고 있던 본문이 통째로 밀려 내려갔다.
 * 여백 마커는 도착해도 자리를 차지하지 않아 화면이 흔들리지 않는다.
 * (절 단위 "지금 읽는 중" 표시는 의도적으로 없다 — 장 상단 pill 이 장 단위 인원을 보여준다)
 */
const VerseTogetherChip = ({ reflectionCount, inline = false, onOpen }: VerseTogetherChipProps) => {
  if (reflectionCount <= 0) return null
  const open = (e: MouseEvent) => {
    e.stopPropagation()
    onOpen()
  }
  const label = `성도의 묵상 ${reflectionCount}개 보기`

  if (inline) {
    return (
      <button type="button" className="rt-chip rt-chip--muted rt-chip--inline" onClick={open} title="함께 읽는 성도의 묵상">
        <span className="rt-chip__icon"><CommentIcon size={11} /></span>
        묵상 {reflectionCount}
      </button>
    )
  }

  return (
    <button type="button" className="rt-verse-mark" onClick={open} title={label} aria-label={label}>
      <span className="rt-verse-mark__icon" aria-hidden><CommentIcon size={12} /></span>
      <span className="rt-verse-mark__count" aria-hidden>{reflectionCount > 9 ? '9+' : reflectionCount}</span>
    </button>
  )
}

export default VerseTogetherChip
