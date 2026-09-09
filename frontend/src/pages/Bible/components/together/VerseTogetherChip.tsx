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
 * 절 아래 "묵상 N" 칩. 0이면 아무것도 그리지 않는다 — 대부분의 절은 조용해야 한다.
 * 묵상 수는 장을 열 때 정해지고 거의 바뀌지 않아 본문 흐름에 두어도 괜찮다.
 * (절 단위 "지금 읽는 중" 표시는 의도적으로 없다 — 장 상단 pill 이 장 단위 인원을 보여준다)
 */
const VerseTogetherChip = ({ reflectionCount, inline = false, onOpen }: VerseTogetherChipProps) => {
  if (reflectionCount <= 0) return null
  const open = (e: MouseEvent) => {
    e.stopPropagation()
    onOpen()
  }

  if (inline) {
    return (
      <button type="button" className="rt-chip rt-chip--muted rt-chip--inline" onClick={open} title="함께 읽는 성도의 묵상">
        <span className="rt-chip__icon"><CommentIcon size={11} /></span>
        묵상 {reflectionCount}
      </button>
    )
  }

  return (
    <div className="rt-verse-chips">
      {/* 안쪽 행이 0fr → 1fr 로 펼쳐지며 등장 — 갑자기 끼어들어 본문을 '툭' 미는 대신 접힌 종이가 열리듯 */}
      <div className="rt-verse-chips__inner">
        <button type="button" className="rt-chip rt-chip--muted" onClick={open} title="함께 읽는 성도의 묵상 보기">
          <span className="rt-chip__icon"><CommentIcon size={13} /></span>
          묵상 {reflectionCount}
        </button>
      </div>
    </div>
  )
}

export default VerseTogetherChip
